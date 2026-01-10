export let removeDrawer = $state({
  isOpen: false as boolean,
  specialList: null as { id: string, name: string } | null,
  open: () => {
    removeDrawer.isOpen = true
  },
  close: () => {
    removeDrawer.isOpen = false
  }
})
