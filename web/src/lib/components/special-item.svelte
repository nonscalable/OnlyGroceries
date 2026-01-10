<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import type { Special } from '$src/lib/core/types'

  interface Props {
    item: Special
    remove: () => void
    toggleInCart: () => void
  }
  let { item, remove, toggleInCart }: Props = $props()
</script>

<Button
  size="lg"
  variant="outline"
  class="grid h-auto w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 {item.inCart
    ? 'bg-slate-200'
    : ''}"
  aria-pressed={item.inCart}
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
    variant="ghost"
    class="px-4 text-slate-500"
    onclick={e => {
      e.stopPropagation()
      remove()
    }}><Trash2 class="size-4" /></Button
  >
</Button>
