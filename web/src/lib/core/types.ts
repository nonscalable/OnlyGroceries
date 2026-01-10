export type Root = {
  items: Record<string, Item>
  globalOrder: string[]
  specials: SpecialLists
}

export type SpecialLists = {
  lists: Record<string, SpecialList>
  order: string[]
}

export type SpecialList = {
  name: string
}

export type BaseItem = {
  text: string
  inCart: boolean
  purchased: boolean
}

export type Staple = BaseItem & {
  kind: 'staple'
}

export type Rare = BaseItem & {
  kind: 'rare'
}

export type Special = BaseItem & {
  kind: 'special'
  specialId: string
}

export type Item = Staple | Rare | Special

export type ItemKind = Item['kind']

export function isStaple(item: Item): item is Staple {
  return item.kind === 'staple'
}

export function isSpecial(item: Item, specialId: string): item is Special {
  return item.kind === 'special' && item.specialId == specialId
}

export function isRare(item: Item): item is Rare {
  return item.kind === 'rare'
}
