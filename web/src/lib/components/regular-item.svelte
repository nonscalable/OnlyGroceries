<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import * as Drawer from '$lib/components/ui/drawer'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import Pencil from 'lucide-svelte/icons/pencil'
  import type { Staple } from '$src/lib/core/types'

  interface Props {
    item: Staple
    toggleInCart: () => void
    deleteItem: () => void
    updateText: (text: string) => void
    onMoveRequest: () => void
  }
  let { deleteItem, toggleInCart, item, updateText, onMoveRequest }: Props = $props()

  let touched = $state(false)
  let confirming = $state(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  function handleDelete() {
    if (confirming) {
      confirming = false
      if (resetTimer) clearTimeout(resetTimer)
      deleteItem()
    } else {
      confirming = true
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { confirming = false }, 3000)
    }
  }

  $effect(() => () => { if (resetTimer) clearTimeout(resetTimer) })

  let editing = $state(false)
  let editText = $state('')
  let inputEl = $state<HTMLInputElement | null>(null)

  function startEdit() {
    editText = item.text
    editing = true
    setTimeout(() => inputEl?.focus(), 0)
  }

  function commitEdit() {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== item.text) updateText(trimmed)
    editing = false
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { editing = false }
  }

  let actionDrawerOpen = $state(false)

  function handleEdit() {
    actionDrawerOpen = false
    startEdit()
  }

  function handleMove() {
    actionDrawerOpen = false
    onMoveRequest()
  }
</script>

<div
  ontouchstart={() => (touched = true)}
  ontouchend={() => (touched = false)}
  ontouchcancel={() => (touched = false)}
  data-select-btn
  class="duration-250 flex min-h-12 w-full items-stretch overflow-hidden rounded-md border {editing ? 'border-blue-400' : 'border-input'} transition-transform ease-out {touched
    ? 'scale-[1.03]'
    : ''} {item.inCart ? 'bg-slate-200 dark:bg-slate-700' : 'bg-background'}"
>
  {#if editing}
    <GripVertical class="mx-2 size-4 self-center text-slate-500" />
    <input
      bind:this={inputEl}
      bind:value={editText}
      onblur={commitEdit}
      onkeydown={handleEditKeydown}
      class="flex-1 bg-transparent py-2 text-sm font-medium outline-none"
    />
  {:else}
    <button
      class="grid flex-1 grid-cols-[auto_1fr_auto] gap-0 px-0 text-sm font-medium"
      onclick={toggleInCart}
    >
      <GripVertical class="mx-2 size-4 self-center text-slate-500" />

      <div class="flex w-full min-w-0 items-center justify-between gap-2">
        <span class="flex-1 truncate py-2 text-left"
          >{item.text}</span
        >
        <ShoppingBasket class="size-4 {item.inCart ? '' : 'invisible'}" />
      </div>
    </button>

    <button class="px-4 text-slate-500 hover:bg-slate-100" onclick={() => { actionDrawerOpen = true }}>
      <Pencil class="size-4" />
    </button>

    <Drawer.Root bind:open={actionDrawerOpen}>
      <Drawer.Content>
        <div class="mx-auto mb-4 w-full max-w-sm">
          <Drawer.Header>
            <Drawer.Title>{item.text}</Drawer.Title>
          </Drawer.Header>
          <div class="flex flex-col gap-2 p-4">
            <Button variant="outline" onclick={handleEdit}>Edit</Button>
            <Button variant="outline" onclick={handleMove}>Move</Button>
            <Button variant="ghost" onclick={() => { actionDrawerOpen = false }}>Cancel</Button>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Root>

    <button
      data-delete-btn
      class="relative overflow-hidden px-4 text-slate-500"
      onclick={handleDelete}
    >
      <span
        class="absolute inset-0 bg-red-500 transition-transform duration-200 ease-out"
        style:transform={confirming ? 'translateX(0)' : 'translateX(100%)'}
      ></span>
      <Trash2 class="relative z-10 size-4" />
    </button>
  {/if}
</div>
