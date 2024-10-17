export type ItemType = 'regular' | 'rare'
export type Item = {
  text: string
  inCart: boolean
  purchased: boolean
  type: ItemType
}
export type ItemsList = {
  items: Item[]
}
