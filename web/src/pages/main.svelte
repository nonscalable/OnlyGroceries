<script lang="ts">
  import '../app.css'
  import * as Tabs from '$lib/components/ui/tabs'
  import AddItemBlock from '$lib/components/add-item-block.svelte'
  import RegularItem from '$lib/components/regular-item.svelte'
  import CartItem from '$lib/components/cart-item.svelte'

  import type { ItemType } from '../types'
  import { g } from '$stores/global.svelte'
  import { draggable, droppable, type DragDropState } from '@thisux/sveltednd'
  import { flip } from 'svelte/animate'
  import { fade } from 'svelte/transition'

  function handleDrop(state: DragDropState<string>) {
    const { draggedItem, targetContainer } = state
    const dragIndex = g.mainDoc?.state?.regularIds.findIndex(
      (id: string) => id === draggedItem
    )
    const dropIndex = parseInt(targetContainer ?? '0')

    if (dragIndex !== -1 && !isNaN(dropIndex)) {
      g.mainDoc?.change(d => {
        const [movedItem] = d.regularIds.splice(dragIndex as number, 1)
        d.regularIds.splice(dropIndex, 0, movedItem)
      })
    }
  }

  const cartIds = $derived.by(() => {
    const state = g.mainDoc?.state

    const regularIds = state?.regularIds ?? []
    const rareIds = state?.rareIds ?? []

    return [...regularIds.filter(id => state?.items?.[id]?.inCart), ...rareIds]
  })

  let mainDoc = $derived(g.mainDoc?.state)

  let activeTab = $state<ItemType>('regular')
</script>

<div class="container pt-2">
  <Tabs.Root bind:value={activeTab}>
    <AddItemBlock {activeTab} />

    <Tabs.Content value="regular">
      <ul class="grid gap-2">
        {#if mainDoc}
          {#each mainDoc.regularIds as id, index (id)}
            <li
              {id}
              use:draggable={{
                container: index.toString(),
                dragData: id,
                interactive: [
                  '[data-delete-btn]',
                  '[data-select-btn]',
                  '.interactive'
                ]
              }}
              use:droppable={{
                container: index.toString(),
                callbacks: { onDrop: handleDrop }
              }}
              animate:flip={{ duration: 200 }}
              in:fade={{ duration: 150 }}
              out:fade={{ duration: 150 }}
            >
              <RegularItem {id} />
            </li>
          {/each}
        {/if}
      </ul>
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
