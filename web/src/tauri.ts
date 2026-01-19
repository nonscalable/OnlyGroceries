import { Channel, invoke } from '@tauri-apps/api/core'

export async function getEndpointId(): Promise<string> {
  const nodeId = (await invoke('get_endpoint_id')) as string
  return nodeId
}

export interface DiscoveredPeer {
  node_id: string
  addrs: string[]
}

type MdnsEvent = { Discovered: DiscoveredPeer } | { Expired: string }

export async function subscribeMdns(handler: (event: MdnsEvent) => void) {
  let channel = new Channel<MdnsEvent>()
  channel.onmessage = handler
  await invoke('subscribe_mdns', {
    channel
  })
}

export async function subscribeRecv(
  remoteStr: string,
  handler: (msg: Uint8Array) => void
) {
  let channel = new Channel<Uint8Array>()
  channel.onmessage = handler
  await invoke('subscribe_recv', { remoteStr, jsChannel: channel })
}

export async function connect(remoteId: string): Promise<void> {
  await invoke('connect', { remoteStr: remoteId })
  return new Promise(resolve => resolve())
}

export async function accept(remoteId: string): Promise<void> {
  await invoke('receive', { remoteStr: remoteId })
  return new Promise(resolve => resolve())
}

export async function send(remoteStr: string, msg: Uint8Array): Promise<void> {
  await invoke('send', { remoteStr, msg })
  return new Promise(resolve => resolve())
}
