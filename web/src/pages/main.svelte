<script lang="ts">
  import '../app.css'
  import * as Tabs from '$lib/components/ui/tabs'
  import AddItemBlock from '$lib/components/add-item-block.svelte'
  import RegularItem from '$lib/components/regular-item.svelte'
  import CartItem from '$lib/components/cart-item.svelte'

  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from '../sortable'
  import type { ItemType } from '../types'
  import { g } from '$stores/global.svelte'

  const cartIds = $derived.by(() => {
    const state = g.mainDoc?.state

    const regularIds = state?.regularIds ?? []
    const rareIds = state?.rareIds ?? []

    return [...regularIds.filter(id => state?.items?.[id]?.inCart), ...rareIds]
  })

  let mainDoc = $derived(g.mainDoc)

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

    g.mainDoc?.change(d => {
      const [movedItem] = d.regularIds.splice(oldIndex, 1)
      d.regularIds.splice(newIndex, 0, movedItem)
    })
  }
</script>

<div class="container pt-2">
  <Tabs.Root bind:value={activeTab}>
    <AddItemBlock {activeTab} />

    <Tabs.Content value="regular">
      <!-- #key is a workaround to prevent errors when users do dnd
      https://github.com/sveltejs/svelte/issues/11826. it fixes "Illegal
      invocation" bug, app crash when item drops out of the parent, when peers
      do dnd at the same time -->
      {#key mainDoc?.state?.regularIds}
        <ul use:sortable={options} class="grid gap-2">
          {#if mainDoc?.state && mainDoc?.state.regularIds}
            {#each mainDoc.state.regularIds as id, i (id)}
              <li>
                <RegularItem item={mainDoc.state.items[id]} {id} />
              </li>
            {/each}
          {/if}
        </ul>
      {/key}
    </Tabs.Content>
    <Tabs.Content value="rare">
      <ul>
        {#each cartIds as id, i (id)}
          <CartItem {id} {i} />
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
    border-radius: calc(var(--radius) - 2px);
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
