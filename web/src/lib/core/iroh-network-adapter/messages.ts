import type { Message, PeerId, PeerMetadata } from '@automerge/automerge-repo'

export type FromClientMessage = JoinMessage | Message

export type FromServerMessage = PeerMessage | Message

/** Sent by the client to the server to tell the server the clients PeerID */
export type JoinMessage = {
  type: 'join'

  /** The PeerID of the client */
  senderId: PeerId

  /** Metadata presented by the peer  */
  peerMetadata: PeerMetadata
}

/** Sent by the server in response to a "join" message to advertise the servers PeerID */
export type PeerMessage = {
  type: 'peer'

  /** The PeerID of the server */
  senderId: PeerId

  /** Metadata presented by the peer  */
  peerMetadata: PeerMetadata

  /** The PeerID of the client */
  targetId: PeerId
}

export const isJoinMessage = (
  message: FromClientMessage
): message is JoinMessage => message.type === 'join'

export const isPeerMessage = (
  message: FromServerMessage
): message is PeerMessage => message.type === 'peer'
