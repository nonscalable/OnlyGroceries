<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import type { SpecialListData, SpecialItem } from '$src/types'
  import type { AutomergeUrl } from '@automerge/automerge-repo'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'

  interface Props {
    item: SpecialItem
    docUrl: AutomergeUrl
    id: string
  }
  let { item, docUrl, id }: Props = $props()
  let doc = document<SpecialListData>(docUrl)

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

<li class="flex">
  <Button
    size="lg"
    variant="outline"
    class="grid w-full grid-cols-[auto_1fr_auto_auto] gap-0 px-0 {item.purchased
      ? 'bg-slate-200'
      : ''}"
    aria-pressed={item.purchased}
    onclick={togglePurchased}
  >
    <GripVertical class="mx-2 size-4 text-slate-500" />

    <div class="flex items-center justify-between">
      <span>{item.text}</span>
      {#if item.purchased}
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
