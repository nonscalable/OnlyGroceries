<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import type { Item } from '$src/types'

  import { g } from '$stores/global.svelte'

  interface Props {
    item: Item
    id: string
  }
  let { item, id }: Props = $props()

  function toggleInCart() {
    g.mainDoc?.change(d => {
      d.items[id].inCart = !d.items[id].inCart
      d.items[id].purchased = false
    })
  }

  function remove() {
    g.mainDoc?.change(d => {
      d.regularIds.splice(
        d.regularIds.findIndex(v => v === id),
        1
      )
      delete d.items[id]
    })
  }
</script>

<Button
  data-select-btn
  size="lg"
  class="interactive grid h-auto w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 {item.inCart
    ? 'bg-slate-200'
    : ''}"
  variant="outline"
  onclick={toggleInCart}
>
  <GripVertical class="mx-2 size-4 text-slate-500" />

  <div class="flex w-full min-w-0 items-center justify-between">
    <span class="flex-1 whitespace-normal break-words break-all py-2 text-left"
      >{item.text}</span
    >
    <ShoppingBasket class="size-4 {item.inCart ? '' : 'invisible'}" />
  </div>

  <Button
    data-delete-btn
    variant="ghost"
    class="px-4 text-slate-500 "
    onclick={e => {
      e.stopPropagation()
      remove()
    }}><Trash2 class="size-4" /></Button
  >
</Button>
