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
  type PeerId,
  type PeerMetadata
} from '@automerge/automerge-repo'
import { toUint8Array } from './util'
import { isPeerMessage } from '@automerge/automerge-repo-network-websocket/dist/messages'

export class IrohClientAdapter extends NetworkAdapter {
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
    console.log('[iroh client] connect self', peerId)

    irohConnect(this.#endpoint).then(() => {
      this.#ready = true
      this.#readyResolver?.()

      // TODO: automerge-websocket-adapter waits
      // for some time and calls 'forceReady' in the main function
      // to not block keep the document 'unavailable'
      this.send(joinMessage(peerId, peerMetadata!))
      subscribeRecv(this.#endpoint, rawMsg => {
        this.receiveMessage(rawMsg)
      })
    })
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
    return this.#readyPromise
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
