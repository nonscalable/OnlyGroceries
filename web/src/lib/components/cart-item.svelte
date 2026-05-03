<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import type { Item } from '$src/lib/core/types'
  import CircleX from 'lucide-svelte/icons/circle-x'

  interface Props {
    i: number
    item: Item
    togglePurchased: () => void
    deleteCartItem: () => void
  }
  let { i, item, togglePurchased, deleteCartItem }: Props = $props()
</script>

<li class="mb-2 flex justify-between">
  <label
    for={`rare-${i}`}
    class="item.purchased flex w-full items-center
   gap-2 leading-8"
    class:line-through={item.purchased}
  >
    <Checkbox
      id={`rare-${i}`}
      checked={item.purchased}
      onCheckedChange={togglePurchased}
    />
    {item.text}
  </label>
  <Button
    variant="ghost"
    size="lg"
    class="px-4 text-slate-500 hover:bg-red-100"
    onclick={deleteCartItem}><CircleX class="size-4" /></Button
  >
</li>
