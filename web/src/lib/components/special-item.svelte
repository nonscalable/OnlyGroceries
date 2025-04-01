<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import type { SpecialItem } from '$src/types'

  import { g } from '$stores/global.svelte'

  interface Props {
    item: SpecialItem
    docID: string
    id: string
  }
  let { item, docID, id }: Props = $props()
  let doc = $derived(g.specialDocs[docID])

  function togglePurchased() {
    doc.change(d => {
      d.items[id].purchased = !d.items[id].purchased
    })
  }

  function remove() {
    doc.change(d => {
      d.ids.splice(
        d.ids.findIndex(v => v === id),
        1
      )
      delete d.items[id]
    })
  }
</script>

<Button
  size="lg"
  variant="outline"
  class="grid h-auto w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 {item.purchased
    ? 'bg-slate-200'
    : ''}"
  aria-pressed={item.purchased}
  onclick={togglePurchased}
>
  <GripVertical class="mx-2 size-4 text-slate-500" />

  <div class="flex w-full min-w-0 items-center justify-between">
    <span class="flex-1 whitespace-normal break-words break-all py-2 text-left"
      >{item.text}</span
    >
    <ShoppingBasket class="size-4 {item.purchased ? '' : 'invisible'}" />
  </div>

  <Button
    variant="ghost"
    class="px-4 text-slate-500"
    onclick={e => {
      e.stopPropagation()
      remove()
    }}><Trash2 class="size-4" /></Button
  >
</Button>
