<script lang="ts">
  import '../app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'

  import { document } from '@automerge/automerge-repo-svelte-store'
  import { type AutomergeUrl } from '@automerge/automerge-repo/slim'
  import type { GroceryData, ItemType } from '../types'
  import { addAutomergePrefix } from '../utils'
  import { nanoid } from 'nanoid'
  import RegularItem from '../lib/components/regular-item.svelte'
  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from '../sortable'
  import CartItem from '../lib/components/cart-item.svelte'
  import AddItemBlock from '$src/lib/components/add-item-block.svelte'

  interface Props {
    id: string
  }
  let { id }: Props = $props()

  let docUrl = addAutomergePrefix(id) as AutomergeUrl
  let doc = document<GroceryData>(docUrl)

  let cartIds = $derived([
    ...$doc.regularIds.filter(id => $doc.items[id].inCart),
    ...$doc.rareIds
  ])

  let activeTab = $state<ItemType>('regular')

  const options: Sortable.SortableOptions = {
    animation: 200,
    onEnd: handleSort,
    forceFallback: false,
    delay: 50,
    delayOnTouchOnly: true
  }
  function handleSort(event: SortableEvent) {
    const { oldIndex, newIndex } = event
    if (typeof oldIndex !== 'number' || typeof newIndex !== 'number') return

    doc.change(d => {
      const [movedItem] = d.regularIds.splice(oldIndex, 1)
      d.regularIds.splice(newIndex, 0, movedItem)
    })
  }
</script>

<div class="container pt-2 sm:w-[350px]">
  <Tabs.Root bind:value={activeTab}>
    <AddItemBlock {activeTab} {docUrl} />

    <Tabs.Content value="regular">
      {#key $doc.regularIds}
        <ul use:sortable={options}>
          {#each $doc.regularIds as id (id)}
            <RegularItem {docUrl} {id} />
          {/each}
        </ul>
      {/key}
    </Tabs.Content>
    <Tabs.Content value="rare">
      <ul>
        {#each cartIds as id, i (id)}
          <CartItem {docUrl} {id} {i} />
        {/each}
      </ul>
    </Tabs.Content>
  </Tabs.Root>
</div>
