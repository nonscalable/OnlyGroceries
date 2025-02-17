export let removeDrawer = $state({
  isOpen: false as boolean,
  listId: null as string | null,
  listName: null as string | null,
  listType: null as 'main' | 'special' | null,
  open: () => {
    removeDrawer.isOpen = true
  },
  close: () => {
    removeDrawer.isOpen = false
  }
})
