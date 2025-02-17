export let createDrawer = $state({
  isOpen: false as boolean,
  open: () => {
    createDrawer.isOpen = true
  },
  close: () => {
    createDrawer.isOpen = false
  }
})
