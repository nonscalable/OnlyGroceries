<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Toggle } from '$lib/components/ui/toggle'
  import type { GroceryData } from './types'
  import type { AutomergeUrl } from '@automerge/automerge-repo'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'

  interface Props {
    docUrl: AutomergeUrl
    id: string
  }
  let { docUrl, id }: Props = $props()
  let doc = document<GroceryData>(docUrl)
  let item = $state($doc.items[id])

  function toggleInCart() {
    doc.change(d => {
      d.items[id].inCart = !d.items[id].inCart
      d.items[id].purchased = false
    })

    item.inCart = !item.inCart
  }

  function remove() {
    doc.change(d => {
      delete d.items[id]
      d.ids.splice(
        d.ids.findIndex(v => v === id),
        1
      )
    })
  }
</script>

<li class="flex gap-2">
  <Toggle
    size="lg"
    variant="default"
    class="mb-2 grid w-full grid-cols-[auto_1fr_auto] pl-0"
    pressed={item.inCart}
    onclick={toggleInCart}
  >
    <Button class="cursor-grab px-4" size="lg" variant="ghost"
      ><GripVertical class="size-4" /></Button
    >

    <div class="flex items-center gap-2">
      <span>{item.text}</span>
    </div>

    {#if item.inCart}
      <ShoppingBasket class="mr-2 size-4" />
    {/if}
  </Toggle>
  <Button
    variant="ghost"
    size="lg"
    class="px-4 text-slate-500 hover:bg-red-100"
    onclick={remove}><Trash2 class="size-4" /></Button
  >
</li>
