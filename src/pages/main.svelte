<script lang="ts">
  import '../app.css'
  import * as Tabs from '$lib/components/ui/tabs'
  import AddItemBlock from '$lib/components/add-item-block.svelte'
  import RegularItem from '$lib/components/regular-item.svelte'
  import CartItem from '$lib/components/cart-item.svelte'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import { type AutomergeUrl } from '@automerge/automerge-repo/slim'
  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from '../sortable'
  import type { GroceryData, ItemType } from '../types'
  import { addAutomergePrefix } from '../utils'

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
    animation: 150,
    swapThreshold: 0.5,
    ghostClass: 'ghost',
    onEnd: handleSort,
    forceFallback: true,
    fallbackClass: 'fallback',
    fallbackTolerance: 1,
    delay: 80,
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
        <ul use:sortable={options} class="grid gap-2">
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

<style>
  :global(.ghost) {
    position: relative;
  }

  :global(.ghost)::before {
    border-radius: 8px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: #f1f5f9;
  }

  :global(.fallback) {
    border-radius: 8px;
    transform: rotate(4deg);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
</style>
