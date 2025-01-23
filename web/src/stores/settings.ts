import { persistentAtom } from '@nanostores/persistent'

export const syncServerUrl = persistentAtom<string>(
  'onlygroceries:syncServerUrl',
  'wss://sync.automerge.org'
)
