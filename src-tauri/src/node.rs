use std::{collections::HashMap, sync::Arc};

use anyhow::bail;
use iroh::{
    discovery::mdns::MdnsDiscovery,
    endpoint::{Connection, RecvStream, SendStream},
    protocol::{ProtocolHandler, Router},
    Endpoint, EndpointId,
};
use tokio::{
    select,
    sync::{mpsc, Mutex},
    task::JoinHandle,
};

pub const SYNC_ALPN: &[u8] = b"iroh/automerge-network-adapter";

pub type RepoMessage = Vec<u8>;

#[derive(derive_more::Debug)]
pub struct Node {
    pub endpoint: Endpoint,
    pub mdns: Arc<Mutex<MdnsDiscovery>>,
    #[debug(skip)]
    conns: Mutex<HashMap<EndpointId, PeerConnection>>,
}

pub struct PeerConnection {
    js_to_rust: mpsc::Sender<RepoMessage>,
    rust_to_js: Arc<Mutex<mpsc::Receiver<RepoMessage>>>,

    // Keep these guys from being dropped
    // They might be used later for graceful shutdown.
    _router: Option<Router>,
    _join_handle: Option<JoinHandle<()>>,
}

// An iroh + tauri wrapper to be used for JS NetworkAdapter implementation.
//
// Inspired by
//  https://github.com/n0-computer/iroh-examples/blob/b70f21e200f7f761860b69efd9af511b56919ff8/iroh-automerge/src/protocol.rs
//
// Key differences between this implementation and iroh example is that
// this implementation does not have direct access to automerge and has to
// send/receive data to/from JS runtime.
//
// That difference implies two things:
// 1. Two asynchronous "programs" has to be coordinated: iroh and JS automerge-repo, which
//    makes things more complicated
// 2. automerge-repo does not send empty message (*) which makes it impossible to use
//    this (**) nice check from iroh example
//
// (*)  https://github.com/automerge/automerge-repo/blob/54ac3db6da1ebab274485429f63765a2da6e5b4b/packages/automerge-repo/src/synchronizer/DocSynchronizer.ts#L205
// (**) https://github.com/n0-computer/iroh-examples/blob/b70f21e200f7f761860b69efd9af511b56919ff8/iroh-automerge/src/protocol.rs#L95-L98
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
            conns: Mutex::new(HashMap::new()),
        })
    }

    pub async fn connect(&self, remote: EndpointId) -> anyhow::Result<()> {
        let conn = self.endpoint.connect(remote, SYNC_ALPN).await?;

        // connect:
        //   - (Remote Recv) chan.send_js (here) -> rust_to_js -> subscribe_recv
        //   - (Send To Remote) fn.send_js -> js_to_rust -> chan.recv_rust
        let (send_js, recv_js) = mpsc::channel::<RepoMessage>(10);
        let (send_rust, mut recv_rust) = mpsc::channel::<RepoMessage>(10);

        let handle = tokio::spawn(async move {
            let (mut send, mut recv) = conn.open_bi().await.unwrap();

            Self::handle_handshake(&mut recv_rust, &send_js, &mut send, &mut recv)
                .await
                .unwrap();

            loop {
                select! {
                    biased;
                    sync_msg = recv_rust.recv() => {
                        send_message(&mut send, sync_msg.unwrap()).await.expect("send");
                    }
                    remote_msg = read_message(&mut recv) => {
                        send_js.send(remote_msg.unwrap()).await.expect("send to JS");
                    }
                }
            }
        });

        let peer_conn = PeerConnection {
            js_to_rust: send_rust,
            rust_to_js: Arc::new(Mutex::new(recv_js)),
            _router: None,
            _join_handle: Some(handle),
        };
        // TODO: check if connected
        self.conns.lock().await.insert(remote, peer_conn);

        Ok(())
    }

    // Handle initial protocol handshake described here:
    //  https://github.com/automerge/automerge-repo/blob/54ac3db6da1ebab274485429f63765a2da6e5b4b/packages/automerge-repo-network-websocket/README.md
    //
    // This function ensures that initial join/peer messages are
    // handled in the correct order. Subsequent `sync` messages might
    // arrive from either side (client or server), but `join` and `peer`
    // has to be handled sequentially.
    pub async fn handle_handshake(
        repo_msg_recv: &mut mpsc::Receiver<RepoMessage>,
        repo_msg_send: &mpsc::Sender<RepoMessage>,
        iroh_send: &mut SendStream,
        iroh_recv: &mut RecvStream,
    ) -> anyhow::Result<()> {
        let join_msg = repo_msg_recv.recv().await.unwrap();
        send_message(iroh_send, join_msg).await?;

        let peer_msg = read_message(iroh_recv).await?;
        // SILENCE, JS IS TALKING
        repo_msg_send.send(peer_msg).await.unwrap();
        let sync_state = repo_msg_recv.recv().await.unwrap();
        // JS RETURNED
        send_message(iroh_send, sync_state).await.unwrap();

        Ok(())
    }

    pub async fn receive(&self, remote: EndpointId) -> anyhow::Result<()> {
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
            js_to_rust: send_rust,
            rust_to_js: Arc::new(Mutex::new(recv_js)),
            _router: Some(router),
            _join_handle: None,
        };

        // TODO: check if connected
        self.conns.lock().await.insert(remote, peer_conn);

        Ok(())
    }

    pub async fn send_js(&self, remote: EndpointId, msg: RepoMessage) -> anyhow::Result<()> {
        match self.conns.lock().await.get(&remote) {
            None => bail!("unknown peer"),
            Some(conn) => {
                conn.js_to_rust.send(msg).await?;
            }
        };

        Ok(())
    }

    pub async fn get_recv_subscription(
        &self,
        remote: EndpointId,
    ) -> anyhow::Result<Arc<Mutex<mpsc::Receiver<RepoMessage>>>> {
        match self.conns.lock().await.get(&remote) {
            None => bail!("unknown peer"),
            Some(conn) => Ok(conn.rust_to_js.clone()),
        }
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

        loop {
            select! {
                biased;
                remote_msg = read_message(&mut recv) => {
                    self.send_js.send(remote_msg.unwrap()).await.expect("send msg to JS");
                }
                sync_msg = async { self.recv_rust.lock().await.recv().await } => {
                    send_message(&mut send, sync_msg.unwrap())
                        .await
                        .expect("send reply to remote");
                }
            };
        }
    }
}

async fn send_message(send: &mut SendStream, msg: RepoMessage) -> anyhow::Result<()> {
    // Write content length
    send.write_all(&(msg.len() as u64).to_le_bytes())
        .await
        .unwrap();

    // Write content
    send.write_all(&msg).await.unwrap();

    Ok(())
}

async fn read_message(recv: &mut RecvStream) -> anyhow::Result<RepoMessage> {
    let mut incoming_len = [0u8; 8];
    recv.read_exact(&mut incoming_len).await?;
    let len = u64::from_le_bytes(incoming_len);

    if len == 0 {
        return Ok(vec![]);
    }

    let mut buffer = vec![0u8; len as usize];
    recv.read_exact(&mut buffer).await?;

    Ok(buffer)
}
