import type { AutomergeUrl } from '@automerge/automerge-repo'
import { openDB } from 'idb'

async function openMetadataDB() {
  return openDB('MetadataDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    }
  })
}

export async function getAutomergeKey(): Promise<AutomergeUrl | null> {
  const db = await openMetadataDB()
  const tx = db.transaction('metadata', 'readonly')
  const store = tx.objectStore('metadata')
  const result = await store.get('automerge_key')

  return result ? result.value : null
}

export async function storeAutomergeKey(automergeKey: string) {
  const db = await openMetadataDB()
  const tx = db.transaction('metadata', 'readwrite')
  const store = tx.objectStore('metadata')
  await store.put({ key: 'automerge_key', value: automergeKey })
}
