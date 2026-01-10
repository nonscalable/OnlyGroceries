<script lang="ts">
  import '../app.css'
  import * as Tabs from '$lib/components/ui/tabs'
  import AddItemBlock from '$lib/components/add-item-block.svelte'
  import RegularItem from '$lib/components/regular-item.svelte'
  import CartItem from '$lib/components/cart-item.svelte'

  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from '../sortable'

  import { type AutomergeDocumentStore } from '@automerge/automerge-repo-svelte-store'
  import {
    type Root,
    type Staple,
    isStaple,
    type ItemKind
  } from '$src/lib/core/types'
  import {
    deleteFromCart,
    toggleInCart,
    togglePurchased,
    createItem,
    deleteItem,
    handleDnd
  } from '$src/lib/core'

  interface Props {
    root: AutomergeDocumentStore<Root> | null
  }
  const { root }: Props = $props()

  let activeTab = $state<ItemKind>('staple')

  let staples = $derived(
    $root?.globalOrder.filter(id => isStaple($root.items[id])) || []
  )
  let cartIds = $derived(
    $root?.globalOrder.filter(id => $root.items[id].inCart) || []
  )

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

    root?.change(doc => {
      if (activeTab == 'staple') {
        handleDnd(doc, staples, oldIndex, newIndex)
      } else {
        handleDnd(doc, cartIds, oldIndex, newIndex)
      }
    })
  }

  function deleteStaple(id: string) {
    root?.change(doc => {
      if (isStaple(doc.items[id])) {
        deleteItem(doc, id)
      }
    })
  }

  function addItem(text: string) {
    root?.change(doc => {
      if (activeTab == 'staple') {
        createItem(doc, {
          text: text,
          kind: 'staple',
          inCart: false,
          purchased: false
        })
      } else {
        createItem(doc, {
          text: text,
          kind: 'rare',
          inCart: true,
          purchased: false
        })
      }
    })
  }
</script>

{#if $root}
  <div class="container pt-2">
    <Tabs.Root bind:value={activeTab}>
      <AddItemBlock addToCart={addItem} {activeTab} />

      <Tabs.Content value="staple">
        <!-- #key is a workaround to prevent errors when users do dnd
      https://github.com/sveltejs/svelte/issues/11826. it fixes "Illegal
      invocation" bug, app crash when item drops out of the parent, when peers
      do dnd at the same time -->
        {#key staples}
          <ul use:sortable={options} class="grid gap-2">
            {#each staples as id, i (id)}
              <li>
                <RegularItem
                  item={$root.items[id] as Staple}
                  toggleInCart={() =>
                    root?.change(doc => toggleInCart(doc, id))}
                  deleteItem={() => deleteStaple(id)}
                />
              </li>
            {/each}
          </ul>
        {/key}
      </Tabs.Content>

      <Tabs.Content value="rare">
        {#key cartIds}
          <ul use:sortable={options} class="grid gap-2">
            {#each cartIds as id, i (id)}
              <CartItem
                {i}
                item={$root?.items[id]}
                togglePurchased={() =>
                  root?.change(doc => togglePurchased(doc, id))}
                deleteCartItem={() =>
                  root?.change(doc => deleteFromCart(doc, id))}
              />
            {/each}
          </ul>
        {/key}
      </Tabs.Content>
    </Tabs.Root>
  </div>
{/if}

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
