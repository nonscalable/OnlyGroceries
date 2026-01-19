import type { DiscoveredPeer } from '$src/tauri'

let peers = $state<Map<string, DiscoveredPeer>>(new Map())
let myNodeId = $state<string | null>(null)

export const peersStore = {
  get uniquePeers(): DiscoveredPeer[] {
    return Array.from(peers.values())
  },
  get myNodeId(): string | null {
    return myNodeId
  },
}

export function addPeer(peer: DiscoveredPeer) {
  const newPeers = new Map(peers)
  newPeers.set(peer.node_id, peer)
  peers = newPeers
}

export function deletePeer(nodeId: string) {
  const newPeers = new Map(peers)
  newPeers.delete(nodeId)
  peers = newPeers
}

export function clearPeers() {
  peers = new Map()
}

export function setMyNodeId(nodeId: string) {
  myNodeId = nodeId
}
