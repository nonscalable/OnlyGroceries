type SpecialListInfo = { name: string; id: string }

export type MetaDoc = {
  mainID: string | null
  specialInfos: Array<SpecialListInfo>
}

// Types for Main List
export type ItemType = 'regular' | 'rare'
export type Item = {
  text: string
  inCart: boolean
  purchased: boolean
  type: ItemType
}
export type Items = Record<string, Item>
export type ItemsOrder = string[]

export type GroceryData = {
  items: Items
  regularIds: ItemsOrder
  rareIds: ItemsOrder
}

// Types for Special Lists
export type SpecialItem = {
  text: string
  purchased: boolean
}

export type SpecialItems = Record<string, SpecialItem>
export type SpecialItemsOrder = string[]

export type SpecialListData = {
  items: SpecialItems
  ids: SpecialItemsOrder
}
