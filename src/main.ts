import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

import { getAutomergeKey, storeAutomergeKey } from './idb'
import { Repo } from '@automerge/automerge-repo'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
import type { ItemsList } from './types'

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

const key = await getAutomergeKey()

let handle
if (key) {
  handle = repo.find(key)
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
  storeAutomergeKey(handle.url)
}

let target = document.getElementById('app')
if (target)
  mount(App, {
    target,
    props: {
      docUrl: handle.url,
      repo
    }
  })
