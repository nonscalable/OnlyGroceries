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
  state: Doc<T> | undefined = $state(undefined)

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

  constructor({ docID, initial }: { docID?: AutomergeUrl; initial?: T }) {
    this.#updateSubscribers = () => {}
    this.#subscribe = createSubscriber(update => {
      this.#updateSubscribers = update
    })
    if (docID) {
      this.#handle = repo.find(docID)
      this.#handle.doc().then(doc => (this.state = doc))
    } else {
      this.#handle = repo.create<T>(initial)
      this.#handle.doc().then(doc => (this.state = doc))
    }

    this.#handle.on('change', p => {
      this.state = p.doc
    })
  }

  change(callback: ChangeFn<T>) {
    this.#handle.whenReady().then(() => {
      this.#handle.change(callback)
      this.state = this.#handle.docSync()
    })
  }

  delete() {
    repo.delete(this.#handle.url as AutomergeUrl)
  }
}
