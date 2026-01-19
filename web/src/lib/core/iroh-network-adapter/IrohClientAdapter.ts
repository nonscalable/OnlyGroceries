import {
  connect as irohConnect,
  send as irohSend,
  subscribeRecv
} from '$src/tauri'
import type {
  FromClientMessage,
  FromServerMessage,
  JoinMessage
} from './messages'
import {
  cbor,
  NetworkAdapter,
  type Message,
  type PeerId,
  type PeerMetadata
} from '@automerge/automerge-repo'
import { toUint8Array } from './util'
import { isPeerMessage } from '@automerge/automerge-repo-network-websocket/dist/messages'

export class IrohClientAdapter extends NetworkAdapter {
  #endpoint: string
  #ready: boolean

  constructor(endpointId: string) {
    super()
    this.#endpoint = endpointId
    this.#ready = false
  }

  connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {
    this.peerId = peerId
    this.peerMetadata = peerMetadata
    console.log('[iroh client] connect self', peerId)

    irohConnect(this.#endpoint).then(() => {
      this.#ready = true
    })

    setTimeout(() => {
      subscribeRecv(this.#endpoint, rawMsg => {
        this.receiveMessage(rawMsg)
      })
    }, 0)

    this.send(joinMessage(this.peerId, this.peerMetadata!))
  }

  receiveMessage(msgBytes: Uint8Array<ArrayBufferLike>) {
    let msg: FromServerMessage
    msg = cbor.decode(toUint8Array(msgBytes))
    console.log('[iroh server] recv', msg)

    const { senderId } = msg

    if (isPeerMessage(msg)) {
      const { peerMetadata } = msg

      this.emit('peer-candidate', {
        peerId: senderId,
        peerMetadata
      })

      return
    }

    this.emit('message', msg)
  }

  send(message: FromClientMessage): void {
    console.log('[iroh client] send', message)
    irohSend(this.#endpoint, cbor.encode(message))
  }

  disconnect(): void {
    console.log('[iroh client] disconnect')
  }

  isReady(): boolean {
    console.log('[iroh client] isReady')
    return this.#ready
  }

  whenReady(): Promise<void> {
    console.log('[iroh client] whenReady init')
    return new Promise(resolve => {
      console.log('[iroh client] whenReady resolve')
      resolve()
    })
  }
}

function joinMessage(
  senderId: PeerId,
  peerMetadata: PeerMetadata
): JoinMessage {
  return {
    type: 'join',
    senderId,
    peerMetadata
  }
}
