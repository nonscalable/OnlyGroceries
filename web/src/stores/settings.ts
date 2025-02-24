import { persistentAtom } from '@nanostores/persistent'

export const syncServerUrl = persistentAtom<string>(
  'onlygroceries:syncServerUrl',
  'wss://sync.automerge.org'
)
// 'ws://localhost:8080?access-token=og'

export const rootdocID = persistentAtom<string>('onlygroceries:rootdocID')
