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
  let globalIdx = -1
  for (let i = 0; i < doc.globalOrder.length; i++) {
    if (String(doc.globalOrder[i]) === itemId) { globalIdx = i; break }
  }
  if (globalIdx === -1) return
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
  let globalOld = -1, globalNew = -1
  for (let i = 0; i < doc.globalOrder.length; i++) {
    const s = String(doc.globalOrder[i])
    if (s === oldId) globalOld = i
    if (s === newId) globalNew = i
  }
  const [movedItem] = doc.globalOrder.splice(globalOld, 1)
  doc.globalOrder.splice(globalNew, 0, movedItem)
}

// Cart

export function deleteFromCart(doc: Root, itemId: string) {
  if (isRare(doc.items[itemId])) {
    deleteItem(doc, itemId)
  } else {
    doc.items[itemId].inCart = false
    doc.items[itemId].purchased = false
  }
}

export function togglePurchased(doc: Root, itemId: string) {
  doc.items[itemId].purchased = !doc.items[itemId].purchased
}

export function toggleInCart(doc: Root, id: string) {
  doc.items[id].inCart = !doc.items[id].inCart
}

export function updateItemText(doc: Root, id: string, text: string) {
  doc.items[id].text = text
}

// Special Lists

export function createSpecialList(doc: Root, id: string, name: string) {
  doc.specials.lists[id] = { name }
  doc.specials.order.push(id)
}

export function renameSpecialList(doc: Root, id: string, name: string) {
  doc.specials.lists[id].name = name
}

export function reorderSpecialLists(
  doc: Root,
  oldIndex: number,
  newIndex: number
) {
  if (
    oldIndex === newIndex ||
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex >= doc.specials.order.length ||
    newIndex >= doc.specials.order.length
  ) {
    return
  }

  const [moved] = doc.specials.order.splice(oldIndex, 1)
  doc.specials.order.splice(newIndex, 0, moved)
}

export function setSpecialListOrder(doc: Root, orderedIds: string[]) {
  if (orderedIds.length !== doc.specials.order.length) return

  const knownIds = new Set(doc.specials.order.map(id => String(id)))
  for (const id of orderedIds) {
    if (!knownIds.has(id)) return
  }

  doc.specials.order.splice(0, doc.specials.order.length, ...orderedIds)
}

export function deleteSpecialList(doc: Root, id: string) {
  const targetId = String(id)
  const items = Object.entries(doc.items)
    .filter(([_, item]) => isSpecial(item, targetId))
    .map(([itemId]) => itemId)

  const idx = doc.specials.order.findIndex(listId => String(listId) === targetId)
  if (idx >= 0) {
    const normalizedListId = String(doc.specials.order[idx])
    doc.specials.order.splice(idx, 1)
    delete doc.specials.lists[normalizedListId]

    for (const item of items) {
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
