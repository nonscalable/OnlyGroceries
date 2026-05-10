<script lang="ts">
  import '../app.css'
  import * as Tabs from '$lib/components/ui/tabs'
  import * as Drawer from '$lib/components/ui/drawer'
  import { Button } from '$lib/components/ui/button'
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
    handleDnd,
    updateItemText
  } from '$src/lib/core'

  interface Props {
    root: AutomergeDocumentStore<Root> | null
  }
  const { root }: Props = $props()

  let activeTab = $state<ItemKind>('staple')

  let staples = $derived(
    $root?.globalOrder.filter(id => isStaple($root.items[id])) || []
  )
  let staplesRenderKey = $derived(staples.join('|'))

  let moveDrawerOpen = $state(false)
  let movingItemId = $state<string | null>(null)

  let moveTargets = $derived(
    ($root?.specials.order ?? []).map(id => ({
      id: String(id),
      name: $root!.specials.lists[String(id)].name
    }))
  )

  function openMoveDrawer(itemId: string) {
    movingItemId = itemId
    moveDrawerOpen = true
  }

  function moveStapleTo(targetListId: string) {
    if (!movingItemId) return
    const id = movingItemId
    root?.change(doc => {
      const item = doc.items[id]
      if (!item || !isStaple(item)) return
      createItem(doc, {
        kind: 'special',
        text: item.text,
        purchased: false,
        inCart: false,
        specialId: targetListId
      })
      deleteItem(doc, id)
    })
    movingItemId = null
    moveDrawerOpen = false
  }

  let cartIds = $derived(
    $root?.globalOrder.filter(id => $root.items[id].inCart) || []
  )

  let regularCartIds = $derived(
    cartIds.filter(id => $root?.items[id].kind !== 'special')
  )
  let regularCartRenderKey = $derived(regularCartIds.join('|'))

  type AddItemSuggestion = {
    id: string
    text: string
    sourceName: string
  }

  let addItemSuggestions = $derived.by<AddItemSuggestion[]>(() => {
    if (!$root) return []

    const suggestions: AddItemSuggestion[] = []
    for (const [id, item] of Object.entries($root.items)) {
      if (item.kind !== 'staple' && item.kind !== 'special') {
        continue
      }

      const trimmed = item.text.trim()
      if (!trimmed) continue

      const sourceName =
        item.kind === 'staple'
          ? 'Staples'
          : ($root.specials.lists[item.specialId]?.name ?? 'Special list')

      suggestions.push({
        id,
        text: trimmed,
        sourceName
      })
    }

    return suggestions
  })

  type SpecialGroup = { listId: string; name: string; ids: string[] }
  let specialCartGroups = $derived.by<SpecialGroup[]>(() => {
    if (!$root) return []
    const seen = new Map<string, string[]>()
    for (const id of cartIds) {
      const item = $root.items[id]
      if (item.kind === 'special') {
        const bucket = seen.get(item.specialId)
        if (bucket) bucket.push(id)
        else seen.set(item.specialId, [id])
      }
    }
    return $root.specials.order
      .filter(listId => (seen.get(listId)?.length ?? 0) > 0)
      .map(listId => ({
        listId,
        name: $root!.specials.lists[listId]?.name ?? listId,
        ids: seen.get(listId)!
      }))
  })

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
        handleDnd(doc, regularCartIds, oldIndex, newIndex)
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

  function addItem(text: string, sourceItemId?: string) {
    root?.change(doc => {
      if (sourceItemId && doc.items[sourceItemId]) {
        doc.items[sourceItemId].inCart = true
        return
      }

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
      <AddItemBlock
        addToCart={addItem}
        {activeTab}
        suggestionSource={addItemSuggestions}
      />

      <Tabs.Content value="staple">
        <!-- #key is a workaround to prevent errors when users do dnd
      https://github.com/sveltejs/svelte/issues/11826. it fixes "Illegal
      invocation" bug, app crash when item drops out of the parent, when peers
      do dnd at the same time -->
        {#key staplesRenderKey}
          <ul use:sortable={options} class="grid gap-2">
            {#each staples as id, i (id)}
              <li>
                <RegularItem
                  item={$root.items[id] as Staple}
                  toggleInCart={() =>
                    root?.change(doc => toggleInCart(doc, id))}
                  deleteItem={() => deleteStaple(id)}
                  updateText={(text) => root?.change(doc => updateItemText(doc, id, text))}
                  onMoveRequest={() => openMoveDrawer(id)}
                />
              </li>
            {/each}
          </ul>
        {/key}
      </Tabs.Content>

      <Tabs.Content value="rare">
        {#if regularCartIds.length > 0}
          <details open>
            <summary
              class="flex cursor-pointer select-none items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span class="chevron">▶</span>
              Shopping List
              <span class="ml-auto text-xs font-normal text-slate-400"
                >{regularCartIds.length}</span
              >
            </summary>
            {#key regularCartRenderKey}
              <ul use:sortable={options} class="mt-1 grid gap-2 pl-2">
                {#each regularCartIds as id, i (id)}
                  <CartItem
                    {i}
                    itemId={id}
                    item={$root?.items[id]}
                    togglePurchased={() =>
                      root?.change(doc => togglePurchased(doc, id))}
                    deleteCartItem={() =>
                      root?.change(doc => deleteFromCart(doc, id))}
                  />
                {/each}
              </ul>
            {/key}
          </details>
        {/if}

        {#each specialCartGroups as group (group.listId)}
          <details class="mt-3" open>
            <summary
              class="flex cursor-pointer select-none items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              <span class="chevron">▶</span>
              {group.name}
              <span class="ml-auto text-xs font-normal text-slate-400"
                >{group.ids.length}</span
              >
            </summary>
            <ul class="mt-1 grid gap-2 pl-2">
              {#each group.ids as id, i (id)}
                <CartItem
                  {i}
                  itemId={id}
                  item={$root?.items[id]}
                  togglePurchased={() =>
                    root?.change(doc => togglePurchased(doc, id))}
                  deleteCartItem={() =>
                    root?.change(doc => deleteFromCart(doc, id))}
                />
              {/each}
            </ul>
          </details>
        {/each}
      </Tabs.Content>
    </Tabs.Root>
  </div>
{/if}

<Drawer.Root bind:open={moveDrawerOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title>Move to list</Drawer.Title>
        <Drawer.Description>Choose a list to move this item to</Drawer.Description>
      </Drawer.Header>
      <div class="flex flex-col gap-2 p-4">
        {#each moveTargets as list}
          <Button variant="outline" onclick={() => moveStapleTo(list.id)}>{list.name}</Button>
        {/each}
        <Button variant="ghost" onclick={() => { moveDrawerOpen = false }}>Cancel</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>

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

  details .chevron {
    display: inline-block;
    font-size: 0.6rem;
    transition: transform 0.2s;
  }

  details[open] .chevron {
    transform: rotate(90deg);
  }
</style>
