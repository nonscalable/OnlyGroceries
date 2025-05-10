import type {
  AutomergeUrl,
  ChangeFn,
  Doc,
  DocHandle
} from '@automerge/automerge-repo'
import { createSubscriber } from 'svelte/reactivity'
import { repo } from './global.svelte'

export class Autodoc<T> {
  #handle: DocHandle<T>
  state: Doc<T> = $state() as Doc<T>

  #subscribe: () => void
  #updateSubscribers: () => void

  get handle(): DocHandle<T> {
    this.#subscribe()
    return this.#handle
  }

  set handle(value: DocHandle<T>) {
    this.#handle = value

    this.#updateSubscribers()
  }

  constructor({ handle }: { handle: DocHandle<T> }) {
    this.#updateSubscribers = () => {}
    this.#subscribe = createSubscriber(update => {
      this.#updateSubscribers = update
    })

    // IMPORTANT: the constructor expects a handle in the 'ready' state.
    // This way, it's up to caller to make sure the handle is ready
    this.#handle = handle
    this.state = handle.doc()

    this.#handle.on('change', p => {
      this.state = p.doc
    })
  }

  change(callback: ChangeFn<T>) {
    this.#handle.change(callback)
  }

  delete() {
    repo.delete(this.#handle.url as AutomergeUrl)
  }
}
