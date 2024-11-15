import { persistentAtom } from '@nanostores/persistent'

export const mainId = persistentAtom<string | undefined>('onlygroceries:mainId')

export function setMainId(id: string): void {
  mainId.set(id)
}
