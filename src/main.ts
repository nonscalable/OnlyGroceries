import './app.css'
import { mount } from 'svelte'

import { getAutomergeKey, storeAutomergeKey } from './idb'
import { Repo, type AutomergeUrl } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import type { ItemsList } from './types'
import Layout from './Layout.svelte'

// Service worker registration
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      if (registration.installing) {
        console.log('Service worker installing')
      } else if (registration.waiting) {
        console.log('Service worker installed')
      } else if (registration.active) {
        console.log('Service worker active')
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`)
    }
  }
}
registerServiceWorker()

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  network: [new BrowserWebSocketClientAdapter('wss://sync.automerge.org')]
})

// TODO: Remove repo find
const key = await getAutomergeKey()

let handle
if (key) {
  handle = repo.find(key as AutomergeUrl)
} else {
  handle = repo.create<ItemsList>({
    items: [
      {
        text: 'Learn Automerge',
        inCart: false,
        purchased: false,
        type: 'regular'
      }
    ]
  })
}
await storeAutomergeKey(handle.url)

let target = document.getElementById('app')
if (target)
  mount(Layout, {
    target,
    props: {
      docUrl: handle.url,
      repo
    }
  })
