use std::{collections::HashMap, sync::Arc};

use anyhow::bail;
use iroh::{
    discovery::mdns::MdnsDiscovery,
    endpoint::{Connection, RecvStream, SendStream},
    protocol::{ProtocolHandler, Router},
    Endpoint, EndpointId,
};
use tokio::{
    sync::{mpsc, oneshot, Mutex},
    task::JoinHandle,
};

use crate::commands::{RepoMessage, SYNC_ALPN};

#[derive(derive_more::Debug)]
pub struct Node {
    pub endpoint: Endpoint,
    pub mdns: Arc<Mutex<MdnsDiscovery>>,
    #[debug(skip)]
    conns: HashMap<EndpointId, Mutex<PeerConnection>>,
}

pub struct PeerConnection {
    // recv: RecvStream,
    // send: SendStream,
    // init_sync: oneshot::Sender<RepoMessage>,
    // init_sync: Mutex<Option<oneshot::Sender<RepoMessage>>>,
    init_sync: Option<oneshot::Sender<RepoMessage>>,
    js_to_rust: mpsc::Sender<RepoMessage>,
    rust_to_js: Arc<Mutex<mpsc::Receiver<RepoMessage>>>,

    router: Option<Router>,
    connection: Option<Connection>,
    join_handle: Option<JoinHandle<()>>,
}

impl Node {
    pub async fn new() -> anyhow::Result<Self> {
        let endpoint = Endpoint::empty_builder(iroh::RelayMode::Disabled)
            .alpns(vec![SYNC_ALPN.to_vec()])
            .bind()
            .await?;

        let mdns = MdnsDiscovery::builder().build(endpoint.id())?;

        endpoint.discovery().add(mdns.clone());

        Ok(Node {
            endpoint,
            mdns: Arc::new(Mutex::new(mdns)),
            conns: HashMap::new(),
        })
    }

    pub async fn connect(&mut self, remote: EndpointId) -> anyhow::Result<()> {
        let conn = self.endpoint.connect(remote, SYNC_ALPN).await?;

        let (init_sync, sync_initialized) = oneshot::channel::<RepoMessage>();

        // connect:
        //   - (Remote Recv) chan.send_js (here) -> rust_to_js -> subscribe_recv
        //   - (Send To Remote) fn.send_js -> js_to_rust -> chan.recv_rust
        let (send_js, recv_js) = mpsc::channel::<RepoMessage>(10);
        let (send_rust, mut recv_rust) = mpsc::channel::<RepoMessage>(10);

        let handle = tokio::spawn(async move {
            let (mut send, mut recv) = conn.open_bi().await.unwrap();

            println!("BEFORE INIT SYNC");
            let init_msg = sync_initialized.await.unwrap();
            Self::send_message(&mut send, Some(init_msg.clone()))
                .await
                .expect("send init message");
            println!("AFTER INIT SYNC {:?}", init_msg);

            loop {
                let remote_msg = Self::read_message(&mut recv).await.expect("read reply");

                if let Some(msg) = remote_msg {
                    // JS reads the message, handles in NetworkAdapter
                    // and sends back
                    // ==== SILENCE, JS IS TALKIN ====
                    send_js.send(msg).await.expect("send msg to JS");
                    let sync_msg = recv_rust.recv().await.expect("get msg from JS");
                    // ==== JS FINISHED ====

                    Self::send_message(&mut send, Some(sync_msg))
                        .await
                        .expect("send reply to remote");
                }
            }
        });

        let peer_conn = PeerConnection {
            init_sync: Some(init_sync),
            js_to_rust: send_rust,
            rust_to_js: Arc::new(Mutex::new(recv_js)),
            router: None,
            connection: None,
            join_handle: Some(handle),
        };

        // TODO: check if connected
        self.conns.insert(remote, Mutex::new(peer_conn));

        Ok(())
    }

    pub async fn receive(&mut self, remote: EndpointId) -> anyhow::Result<()> {
        let (send_js, recv_js) = mpsc::channel::<RepoMessage>(10);
        let (send_rust, recv_rust) = mpsc::channel::<RepoMessage>(10);

        let handler = ConnHandler {
            send_js,
            recv_rust: Mutex::new(recv_rust),
        };
        let router = Router::builder(self.endpoint.clone())
            .accept(SYNC_ALPN, handler)
            .spawn();

        let peer_conn = PeerConnection {
            init_sync: None,
            js_to_rust: send_rust,
            rust_to_js: Arc::new(Mutex::new(recv_js)),

            router: Some(router),
            connection: None,
            join_handle: None,
        };

        // TODO: check if connected
        self.conns.insert(remote, Mutex::new(peer_conn));

        Ok(())
    }

    pub async fn send_js(&self, remote: EndpointId, msg: RepoMessage) -> anyhow::Result<()> {
        let conn = match self.conns.get(&remote) {
            None => bail!("unknown peer"),
            Some(conn) => conn,
        };

        let mut conn = conn.lock().await;

        if let Some(kickoff) = conn.init_sync.take() {
            kickoff.send(msg).expect("kickoff sync protocol");
            return Ok(());
        };

        conn.js_to_rust.send(msg).await?;

        Ok(())
    }

    pub async fn get_conn(
        &self,
        remote: EndpointId,
    ) -> anyhow::Result<Arc<Mutex<mpsc::Receiver<RepoMessage>>>> {
        let conn = match self.conns.get(&remote) {
            None => bail!("unknown peer"),
            Some(conn) => conn,
        };

        let conn = conn.lock().await;

        Ok(conn.rust_to_js.clone())
    }

    async fn send_message(send: &mut SendStream, msg: Option<RepoMessage>) -> Result<(), String> {
        if let Some(msg) = msg {
            // Write content length
            send.write_all(&(msg.len() as u64).to_le_bytes())
                .await
                .unwrap();

            // Write the message
            send.write_all(&msg).await.unwrap();
        } else {
            send.write_all(&0u64.to_le_bytes()).await.unwrap();
        }

        Ok(())
    }

    async fn read_message(recv: &mut RecvStream) -> anyhow::Result<Option<RepoMessage>> {
        let mut incoming_len = [0u8; 8];
        recv.read_exact(&mut incoming_len).await?;
        let len = u64::from_le_bytes(incoming_len);

        if len == 0 {
            // zero length indicates no meaningful message this round
            return Ok(None);
        }

        let mut buffer = vec![0u8; len as usize];
        recv.read_exact(&mut buffer).await?;

        Ok(Some(buffer))
    }
}

#[derive(Debug)]
struct ConnHandler {
    send_js: mpsc::Sender<RepoMessage>,
    recv_rust: Mutex<mpsc::Receiver<RepoMessage>>,
}

impl ProtocolHandler for ConnHandler {
    async fn accept(&self, connection: Connection) -> Result<(), iroh::protocol::AcceptError> {
        let (mut send, mut recv) = connection.accept_bi().await.unwrap();
        println!("ACCEPTED BI");

        loop {
            println!("BEFORE READ");
            let remote_msg = Node::read_message(&mut recv).await.expect("read reply");
            println!("AFTER READ {:?}", remote_msg);

            if let Some(msg) = remote_msg {
                // JS reads the message, handles in NetworkAdapter
                // and sends back
                // ==== SILENCE, JS IS TALKIN ====
                self.send_js.send(msg).await.expect("send msg to JS");
                let sync_msg = self
                    .recv_rust
                    .lock()
                    .await
                    .recv()
                    .await
                    .expect("get msg from JS");
                // ==== JS FINISHED ====

                Node::send_message(&mut send, Some(sync_msg))
                    .await
                    .expect("send reply to remote");
            }
        }
    }
}
