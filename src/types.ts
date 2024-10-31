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
  ids: ItemsOrder
}
