import { Repo } from '@automerge/automerge-repo'
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
import type { AutomergeUrl } from '@automerge/automerge-repo'
import { persistentAtom } from '@nanostores/persistent'
import type { Root } from './types'
import { defaultState } from '.'

export interface RootDocLink {
  name: string
  url: AutomergeUrl
}

export const syncServerUrl = persistentAtom<string>(
  'onlygroceries:syncServerUrl',
  // 'ws://localhost:8080?access-token=og'
  'wss://sync.automerge.org'
)

export const persistedRootUrl = persistentAtom<AutomergeUrl>(
  'onlygroceries:rootDocUrl'
)

const rootDocLinks = persistentAtom<string>('onlygroceries:rootDocLinks', '[]')

export const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  network: [new WebSocketClientAdapter(syncServerUrl.get())]
})

export function createRootDoc(): AutomergeUrl {
  const handle = repo.create<Root>(defaultState())
  return handle.url
}

function parseRootDocLinks(raw: string): RootDocLink[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is RootDocLink =>
        Boolean(item) &&
        typeof item.name === 'string' &&
        typeof item.url === 'string' &&
        item.url.startsWith('automerge:')
    )
  } catch {
    return []
  }
}

export function getRootDocLinks(): RootDocLink[] {
  return parseRootDocLinks(rootDocLinks.get())
}

function setRootDocLinks(links: RootDocLink[]) {
  rootDocLinks.set(JSON.stringify(links))
}

export function upsertRootDocLink(name: string, url: AutomergeUrl): RootDocLink[] {
  const trimmedName = name.trim() || 'Unnamed list'
  const links = getRootDocLinks()
  const index = links.findIndex(link => link.url === url)

  if (index >= 0) {
    links[index] = { ...links[index], name: trimmedName }
  } else {
    links.push({ name: trimmedName, url })
  }

  setRootDocLinks(links)
  return links
}

export function addRootDocLink(name: string, url: AutomergeUrl): RootDocLink[] {
  const trimmedName = name.trim() || 'Unnamed list'
  const links = getRootDocLinks()

  const alreadyExists = links.some(
    link => link.url === url && link.name === trimmedName
  )
  if (alreadyExists) {
    return links
  }

  const next = [...links, { name: trimmedName, url }]
  setRootDocLinks(next)
  return next
}

export function removeRootDocLink(name: string, url: AutomergeUrl): RootDocLink[] {
  const trimmedName = name.trim()
  const links = getRootDocLinks()
  const index = links.findIndex(
    link => link.url === url && link.name.trim() === trimmedName
  )

  if (index < 0) {
    return links
  }

  const next = [...links.slice(0, index), ...links.slice(index + 1)]
  setRootDocLinks(next)
  return next
}

export function replaceRootDocLinks(links: RootDocLink[]): RootDocLink[] {
  const next = links.filter(
    (link): link is RootDocLink =>
      Boolean(link) &&
      typeof link.name === 'string' &&
      typeof link.url === 'string' &&
      link.url.startsWith('automerge:')
  )

  setRootDocLinks(next)
  return next
}

export function ensureDefaultRootDocLink(url: AutomergeUrl): RootDocLink[] {
  const links = getRootDocLinks()

  if (links.length === 0) {
    const defaults = [{ name: 'default', url }]
    setRootDocLinks(defaults)
    return defaults
  }

  if (!links.some(link => link.url === url)) {
    const next = [...links, { name: `list ${links.length + 1}`, url }]
    setRootDocLinks(next)
    return next
  }

  return links
}

export function getRoot(): AutomergeUrl {
  let rootUrl = persistedRootUrl.get()

  if (!rootUrl) {
    rootUrl = createRootDoc()
    persistedRootUrl.set(rootUrl)
  }

  ensureDefaultRootDocLink(rootUrl)

  return rootUrl
}
