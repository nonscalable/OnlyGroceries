import { Repo } from '@automerge/automerge-repo'
import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import { syncServerUrl, rootdocID } from './settings'
import { addAutomergePrefix, stripAutomergePrefix } from '$src/utils'
import type { GroceryData, RootDoc, SpecialListData } from '$src/types'
import { Autodoc } from './autodoc.svelte'

rootdocID.subscribe(() => {
  console.log('i subscribe on rootdocid changes')
})
export const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  network: [new BrowserWebSocketClientAdapter(syncServerUrl.get())]
})

export let g = $state({
  rootDoc: undefined as Autodoc<RootDoc> | undefined,
  mainDoc: undefined as Autodoc<GroceryData> | undefined,
  specialDocs: {} as Record<string, Autodoc<SpecialListData>>
})
;(globalThis as any).g = g

$effect.root(() => {
  // Set rootdoc
  $effect(() => {
    let id = rootdocID.get()

    if (id && !g.rootDoc) {
      g.rootDoc = new Autodoc({ docID: addAutomergePrefix(id) })
    } else {
      let handle = repo.create<RootDoc>({
        mainID: null,
        specialInfos: []
      })
      g.rootDoc = new Autodoc({ docID: handle.url })
      rootdocID.set(stripAutomergePrefix(handle.url))
    }
  })

  // Set maindoc and specialdocs if rootdoc has their ids
  $effect.pre(() => {
    if (g.rootDoc && g.rootDoc.state?.mainID && !g.mainDoc) {
      g.mainDoc = new Autodoc({
        docID: addAutomergePrefix(g.rootDoc.state.mainID)
      })
    }
    //TODO: check if specialIDs has the same ids as specialDocs has
    if (
      g.rootDoc &&
      g.rootDoc.state?.specialInfos &&
      g.rootDoc.state?.specialInfos.length > 0 &&
      Object.keys(g.specialDocs) &&
      Object.keys(g.specialDocs).length === 0
    ) {
      for (let data of g.rootDoc.state.specialInfos) {
        g.specialDocs[data.id] = new Autodoc({
          docID: addAutomergePrefix(data.id)
        })
      }
    }
  })
})
