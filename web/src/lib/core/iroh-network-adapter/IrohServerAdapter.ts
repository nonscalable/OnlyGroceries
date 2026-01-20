import {
  accept as irohAccept,
  send as irohSend,
  subscribeRecv
} from '$src/tauri'
import type { FromClientMessage } from '@automerge/automerge-repo-network-websocket'
import { isJoinMessage, type FromServerMessage } from './messages'
import {
  cbor,
  NetworkAdapter,
  type PeerId,
  type PeerMetadata
} from '@automerge/automerge-repo'
import { toUint8Array } from './util'

export class IrohServerAdapter extends NetworkAdapter {
  #endpoint: string
  #ready: boolean
  #readyResolver?: () => void
  #readyPromise: Promise<void> = new Promise<void>(resolve => {
    this.#readyResolver = resolve
  })

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
      this.#readyResolver?.()

      // TODO: automerge-websocket-adapter waits
      // for some time and calls 'forceReady' in the main function
      // to not block keep the document 'unavailable'
      subscribeRecv(this.#endpoint, rawMsg => {
        this.receiveMessage(rawMsg)
      })
    })
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
    return this.#readyPromise
  }
}
