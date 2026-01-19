import {
  accept as irohAccept,
  connect as irohConnect,
  send as irohSend,
  subscribeRecv
} from '$src/tauri'
import type { FromClientMessage } from '@automerge/automerge-repo-network-websocket'
import { isJoinMessage, type FromServerMessage } from './messages'
import {
  cbor,
  NetworkAdapter,
  type Message,
  type PeerId,
  type PeerMetadata
} from '@automerge/automerge-repo'
import { toUint8Array } from './util'

export class IrohServerAdapter extends NetworkAdapter {
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
    console.log('[iroh server] connect self', peerId)

    irohAccept(this.#endpoint).then(() => {
      this.#ready = true
    })

    setTimeout(() => {
      subscribeRecv(this.#endpoint, rawMsg => {
        this.receiveMessage(rawMsg)
      })
    }, 0)
  }

  receiveMessage(msgBytes: Uint8Array<ArrayBufferLike>) {
    let msg: FromClientMessage
    msg = cbor.decode(toUint8Array(msgBytes))
    console.log('[iroh server] recv', msg)

    const { senderId } = msg

    if (isJoinMessage(msg)) {
      const { peerMetadata } = msg

      this.emit('peer-candidate', {
        peerId: senderId,
        peerMetadata
      })

      this.send({
        type: 'peer',
        senderId: this.peerId!,
        peerMetadata: this.peerMetadata!,
        targetId: senderId
      })

      return
    }

    this.emit('message', msg)
  }

  send(message: FromServerMessage): void {
    console.log('[iroh server] send', message)
    irohSend(this.#endpoint, cbor.encode(message))
  }

  disconnect(): void {
    console.log('[iroh server] disconnect')
  }

  isReady(): boolean {
    console.log('[iroh server] isReady')
    return this.#ready
  }

  whenReady(): Promise<void> {
    console.log('[iroh server] whenReady init')
    return new Promise(resolve => {
      console.log('[iroh server] whenReady resolve')
      resolve()
    })
  }
}
