<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import CircleX from 'lucide-svelte/icons/circle-x'
  import type { AutomergeUrl } from '@automerge/automerge-repo/slim'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import type { GroceryData } from './types'

  interface Props {
    docUrl: AutomergeUrl
    id: string
    i: number
  }
  let { docUrl, id, i }: Props = $props()
  let doc = document<GroceryData>(docUrl)

  function togglePurchased() {
    doc.change(d => {
      d.items[id].purchased = !d.items[id].purchased
    })
  }

  function remove() {
    doc.change(d => {
      let index = d.regularIds.findIndex(regId => regId === id)
      if (index !== -1) {
        d.items[id].inCart = false
      } else {
        index = d.rareIds.findIndex(rareId => rareId === id)
        if (index !== -1) {
          d.rareIds.splice(index, 1)
        }
        delete d.items[id]
      }
    })
  }
</script>

<li class="mb-2 flex justify-between">
  <label
    for={`rare-${i}`}
    class="item.purchased flex w-full items-center
   gap-2 leading-8"
    class:line-through={$doc.items[id].purchased}
  >
    <Checkbox
      id={`rare-${i}`}
      checked={$doc.items[id].purchased}
      onCheckedChange={togglePurchased}
    />
    {$doc.items[id].text}
  </label>
  <Button
    variant="ghost"
    size="lg"
    class="px-4 text-slate-500 hover:bg-red-100"
    onclick={remove}><CircleX class="size-4" /></Button
  >
</li>
