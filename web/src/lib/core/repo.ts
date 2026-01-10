import { Repo } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import { persistentAtom } from '@nanostores/persistent'
import type { Root } from './types'
import { defaultState } from '.'

export const syncServerUrl = persistentAtom<string>(
  'onlygroceries:syncServerUrl',
  'ws://localhost:8080?access-token=og'
  // 'wss://sync.automerge.org'
)

export const persistedRootUrl = persistentAtom<AutomergeUrl>(
  'onlygroceries:rootDocUrl'
)

export const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  network: [new WebSocketClientAdapter(syncServerUrl.get())]
})

export function getRoot(): AutomergeUrl {
  let rootUrl = persistedRootUrl.get()

  if (!rootUrl) {
    const handle = repo.create<Root>(defaultState())
    rootUrl = handle.url
    persistedRootUrl.set(rootUrl)
  }

  return rootUrl
}
