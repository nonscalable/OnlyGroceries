use std::str::FromStr;

use futures::StreamExt;
use iroh::{discovery::mdns::DiscoveryEvent, EndpointId};
use serde::Serialize;
use tauri::{command, ipc::Channel, State};

use crate::node::{Node, RepoMessage};

#[derive(Debug, Clone, Serialize)]
pub struct DiscoveredPeer {
    pub node_id: String,
    pub addrs: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub enum MdnsEvent {
    Discovered(DiscoveredPeer),
    Expired(String),
}

#[command]
pub(crate) async fn get_endpoint_id(state: State<'_, Node>) -> Result<String, String> {
    Ok(state.endpoint.id().to_string())
}

#[command]
pub(crate) async fn subscribe_mdns(
    state: State<'_, Node>,
    channel: Channel<MdnsEvent>,
) -> Result<(), String> {
    let mdns = state.mdns.clone();

    let mut events = mdns.lock().await.subscribe().await;
    while let Some(event) = events.next().await {
        let msg = match event {
            DiscoveryEvent::Discovered { endpoint_info, .. } => {
                MdnsEvent::Discovered(DiscoveredPeer {
                    node_id: endpoint_info.endpoint_id.to_string(),
                    addrs: endpoint_info.addrs().map(|a| format!("{:?}", a)).collect(),
                })
            }
            DiscoveryEvent::Expired { endpoint_id } => MdnsEvent::Expired(endpoint_id.to_string()),
        };

        if channel.send(msg).is_err() {
            break;
        }
    }

    Ok(())
}

#[command]
pub(crate) async fn connect(state: State<'_, Node>, remote_str: String) -> Result<(), String> {
    let remote = EndpointId::from_str(&remote_str).unwrap();
    state.connect(remote).await.unwrap();
    Ok(())
}

#[command]
pub(crate) async fn send(
    state: State<'_, Node>,
    remote_str: String,
    msg: Vec<u8>,
) -> Result<(), String> {
    let remote = EndpointId::from_str(&remote_str).unwrap();

    state
        .send_js(remote, msg)
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

#[command]
pub(crate) async fn subscribe_recv(
    state: State<'_, Node>,
    remote_str: String,
    js_channel: Channel<RepoMessage>,
) -> Result<(), String> {
    let remote = EndpointId::from_str(&remote_str).unwrap();

    let conn = state.get_recv_subscription(remote).await.unwrap();

    while let Some(px) = conn.lock().await.recv().await {
        js_channel.send(px).expect("send message to JS via IPC");
    }

    Ok(())
}

#[command]
pub(crate) async fn receive(state: State<'_, Node>, remote_str: String) -> Result<(), String> {
    let remote = EndpointId::from_str(&remote_str).unwrap();
    state.receive(remote).await.unwrap();
    Ok(())
}
