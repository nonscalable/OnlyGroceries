import { persistentAtom } from '@nanostores/persistent'

// store for main list
export const mainId = persistentAtom<string | undefined>('onlygroceries:mainId')

export function setMainId(id: string): void {
  mainId.set(id)
}

// store for special lists
type SpecialList = {
  name: string
  id: string
}

export const specialLists = persistentAtom<SpecialList[]>('specialLists', [], {
  encode: JSON.stringify,
  decode: JSON.parse
})

export function setSpecialList({ name, id }: SpecialList): void {
  specialLists.set([...specialLists.get(), { name, id }])
}

export function getSpecialListName(id: string): string | null {
  const list = specialLists.get().find(item => item.id === id)
  return list ? list.name : null
}

export function removeSpecialList(id: string): void {
  specialLists.set([...specialLists.get().filter(item => item.id !== id)])
}

export function isNamePresent(newName: string): boolean {
  return specialLists.get().some(({ name, id }) => name === newName)
}
