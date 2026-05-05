<script lang="ts">
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import SpecialItem from '$lib/components/special-item.svelte'
  import * as Drawer from '$lib/components/ui/drawer'

  import { nanoid } from 'nanoid'
  import { sortable } from '../sortable'
  import Sortable, { type SortableEvent } from 'sortablejs'

  import { toast } from 'svelte-sonner'
  import { isSpecial, type Root, type Special } from '$src/lib/core/types'
  import { type AutomergeDocumentStore } from '@automerge/automerge-repo-svelte-store'
  import {
    toggleInCart,
    createItem,
    deleteItem,
    handleDnd,
    updateItemText
  } from '$src/lib/core'
  import Pencil from 'lucide-svelte/icons/pencil'
  import { renameSpecialList } from '$src/lib/core'

  interface Props {
    listId: string
    root: AutomergeDocumentStore<Root> | null
  }
  const { root, listId }: Props = $props()

  let title = $derived($root?.specials.lists[listId].name)
  let text = $state('')
  let editingTitle = $state(false)
  let editTitleText = $state('')
  let titleInputEl = $state<HTMLInputElement | null>(null)

  function startEditTitle() {
    editTitleText = title ?? ''
    editingTitle = true
    setTimeout(() => titleInputEl?.focus(), 0)
  }

  function commitTitle() {
    const trimmed = editTitleText.trim()
    if (trimmed && trimmed !== title) {
      root?.change(doc => renameSpecialList(doc, listId, trimmed))
    }
    editingTitle = false
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
    if (e.key === 'Escape') { editingTitle = false }
  }
  let specials = $derived(
    $root?.globalOrder.filter(id => isSpecial($root.items[id], listId)) || []
  )

  let movingItemId = $state<string | null>(null)
  let moveDrawerOpen = $state(false)

  let otherLists = $derived(
    [
      { id: 'staples', name: 'Staples' },
      ...($root?.specials.order ?? []).filter(id => String(id) !== listId).map(id => ({
        id: String(id),
        name: $root!.specials.lists[String(id)].name
      }))
    ]
  )

  function openMoveDrawer(itemId: string) {
    movingItemId = itemId
    moveDrawerOpen = true
  }

  function moveItemToList(targetListId: string) {
    if (!movingItemId) return
    const id = movingItemId
    root?.change(doc => {
      const item = doc.items[id]
      if (!item || !isSpecial(item, listId)) return
      if (targetListId === 'staples') {
        createItem(doc, {
          kind: 'staple',
          text: item.text,
          purchased: false,
          inCart: false
        })
      } else {
        createItem(doc, {
          kind: 'special',
          text: item.text,
          purchased: false,
          inCart: false,
          specialId: targetListId
        })
      }
      deleteItem(doc, id)
    })
    movingItemId = null
    moveDrawerOpen = false
  }

  function addSpecial() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      toast.error('You have to type something')
      return
    }

    root?.change(doc => {
      createItem(doc, {
        kind: 'special',
        text: text.trim(),
        purchased: false,
        inCart: false,
        specialId: listId
      })
    })
    text = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      addSpecial()
    }
  }

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
      handleDnd(doc, specials, oldIndex, newIndex)
    })
  }
</script>

<div class="container pt-2">
  <div class="flex w-full items-center gap-2">
    {#if editingTitle}
      <input
        bind:this={titleInputEl}
        bind:value={editTitleText}
        onblur={commitTitle}
        onkeydown={handleTitleKeydown}
        class="flex-1 border-b-2 border-blue-400 bg-transparent text-3xl font-bold outline-none"
      />
    {:else}
      <h1 class="flex-1 text-3xl font-bold">{title}</h1>
      <button
        onclick={startEditTitle}
        class="text-slate-400 hover:text-slate-600"
        aria-label="Rename list"
      >
        <Pencil class="size-5" />
      </button>
    {/if}
  </div>
  <div class="mb-4 mt-4 flex flex-col gap-1">
    <Input
      class="text-md focus-visible:ring-offset-1"
      bind:value={text}
      onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
      required
    />

    <Button class="mt-3" onclick={addSpecial} size="lg">Add</Button>
  </div>

  {#key specials}
    <ul use:sortable={options} class="grid gap-2">
      {#each specials as id (id)}
        <li>
          <SpecialItem
            item={$root?.items[id] as Special}
            remove={() => root?.change(doc => deleteItem(doc, id))}
            toggleInCart={() => root?.change(doc => toggleInCart(doc, id))}
            updateText={(text) => root?.change(doc => updateItemText(doc, id, text))}
            onMoveRequest={() => openMoveDrawer(id)}
          />
        </li>
      {/each}
    </ul>
  {/key}
</div>

<Drawer.Root bind:open={moveDrawerOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title>Move to list</Drawer.Title>
        <Drawer.Description>Choose a list to move this item to</Drawer.Description>
      </Drawer.Header>
      <div class="flex flex-col gap-2 p-4">
        {#each otherLists as list}
          <Button variant="outline" onclick={() => moveItemToList(list.id)}>{list.name}</Button>
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
</style>
