<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import CircleX from 'lucide-svelte/icons/circle-x'

  import { g } from '$src/stores/global.svelte'
  interface Props {
    id: string
    i: number
  }
  let { id, i }: Props = $props()

  function togglePurchased() {
    g.mainDoc?.change(d => {
      d.items[id].purchased = !d.items[id].purchased
    })
  }

  function remove() {
    g.mainDoc?.change(d => {
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

{#if g.mainDoc && g.mainDoc.state}
  {@const item = g.mainDoc.state.items[id]}
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
      onclick={remove}><CircleX class="size-4" /></Button
    >
  </li>
{/if}
