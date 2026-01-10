import {
  isRare,
  isSpecial,
  type Item,
  type Root,
  type SpecialLists
} from '$src/lib/core/types'
import { nanoid } from 'nanoid'

// Base

export function createItem(doc: Root, item: Item) {
  const id = nanoid()
  doc.items[id] = item
  doc.globalOrder.push(id)
}

export function deleteItem(doc: Root, itemId: string) {
  const globalIdx = doc.globalOrder.indexOf(itemId)
  doc.globalOrder.splice(globalIdx, 1)
  delete doc.items[itemId]
}

export function handleDnd(
  doc: Root,
  itemsView: string[],
  oldIndex: number,
  newIndex: number
) {
  const oldId = itemsView[oldIndex]
  const newId = itemsView[newIndex]
  const globalOld = doc.globalOrder.indexOf(oldId)
  const globalNew = doc.globalOrder.indexOf(newId)
  const [movedItem] = doc.globalOrder.splice(globalOld, 1)
  doc.globalOrder.splice(globalNew, 0, movedItem)
}

// Cart

export function deleteFromCart(doc: Root, itemId: string) {
  if (isRare(doc.items[itemId])) {
    deleteItem(doc, itemId)
  } else {
    doc.items[itemId].inCart = false
  }
}

export function togglePurchased(doc: Root, itemId: string) {
  doc.items[itemId].purchased = !doc.items[itemId].purchased
}

export function toggleInCart(doc: Root, id: string) {
  doc.items[id].inCart = !doc.items[id].inCart
}

// Special Lists

export function createSpecialList(doc: Root, id: string, name: string) {
  doc.specials.lists[id] = { name }
  doc.specials.order.push(id)
}

export function deleteSpecialList(doc: Root, id: string) {
  const items = Object.entries(doc.items)
    .filter(([_, item]) => isSpecial(item, id))
    .map(([id]) => id)

  const idx = doc.specials.order.indexOf(id)
  if (idx >= 0) {
    doc.specials.order.splice(idx, 1)
    delete doc.specials.lists[id]

    for (let item of items) {
      deleteItem(doc, item)
    }
  }
}

export function defaultState(): Root {
  const defaultSpecialId = nanoid()
  const defaultSpecialItems: Record<string, Item> = {
    [nanoid()]: {
      text: 'Bratwurst 🌭✨',
      purchased: false,
      inCart: true,
      kind: 'special',
      specialId: defaultSpecialId
    },
    [nanoid()]: {
      text: 'Glühwein 🍷🎄',
      purchased: false,
      inCart: false,
      kind: 'special',
      specialId: defaultSpecialId
    },
    [nanoid()]: {
      text: 'Weihnachtsstollen 🍞🎅',
      purchased: false,
      inCart: false,
      kind: 'special',
      specialId: defaultSpecialId
    },
    [nanoid()]: {
      text: 'Lebkuchen 🍪⭐',
      purchased: false,
      inCart: false,
      kind: 'special',
      specialId: defaultSpecialId
    }
  }
  const defaultStaples: Record<string, Item> = {
    [nanoid()]: {
      text: 'Milk 🥛',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Bread 🍞',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Salad 🥬',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Tomatoes 🍅',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Avocado 🥑',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Eggs 🥚',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Cheese 🧀',
      kind: 'staple',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Chocolate 🍫',
      kind: 'staple',
      purchased: false,
      inCart: false
    }
  }
  const defaultItems = { ...defaultStaples, ...defaultSpecialItems }
  const defaultSpecials: SpecialLists = {
    order: [defaultSpecialId],
    lists: {
      [defaultSpecialId]: {
        name: 'Xmas Market'
      }
    }
  }

  return {
    items: defaultItems,
    globalOrder: Object.keys(defaultItems),
    specials: defaultSpecials
  }
}
