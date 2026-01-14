<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import type { Staple } from '$src/lib/core/types'

  interface Props {
    item: Staple
    toggleInCart: () => void
    deleteItem: () => void
  }
  let { deleteItem, toggleInCart, item }: Props = $props()

  let touched = $state(false)
</script>

<Button
  ontouchstart={() => (touched = true)}
  ontouchend={() => (touched = false)}
  ontouchcancel={() => (touched = false)}
  data-select-btn
  size="lg"
  class="duration-250 grid min-h-12 w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 transition-transform ease-out {touched
    ? 'scale-[1.03]'
    : ''} {item.inCart ? 'bg-slate-200' : ''}"
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
      deleteItem()
    }}><Trash2 class="size-4" /></Button
  >
</Button>
