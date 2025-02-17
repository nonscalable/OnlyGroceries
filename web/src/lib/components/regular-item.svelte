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

<li class="flex">
  <Button
    size="lg"
    variant="outline"
    class="grid w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 {item.inCart
      ? 'bg-slate-200'
      : ''}"
    aria-pressed={item.inCart}
    onclick={toggleInCart}
  >
    <GripVertical class="mx-2 size-4 text-slate-500" />

    <div class="flex items-center justify-between">
      <span>{item.text}</span>
      {#if item.inCart}
        <ShoppingBasket class="size-4" />
      {/if}
    </div>

    <Button
      variant="ghost"
      class="px-4 text-slate-500 "
      onclick={e => {
        e.stopPropagation()
        remove()
      }}><Trash2 class="size-4" /></Button
    >
  </Button>
</li>
