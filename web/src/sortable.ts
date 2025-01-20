import Sortable, { type SortableOptions } from 'sortablejs'

export function sortable(node: HTMLElement, options: SortableOptions) {
  const sortableInstance = Sortable.create(node, options)

  return {
    destroy() {
      sortableInstance.destroy()
    }
  }
}
