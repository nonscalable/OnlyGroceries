<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import GripVertical from 'lucide-svelte/icons/grip-vertical'
  import ShoppingBasket from 'lucide-svelte/icons/shopping-basket'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import type { Special } from '$src/lib/core/types'

  interface Props {
    item: Special
    remove: () => void
    toggleInCart: () => void
    updateText: (text: string) => void
  }
  let { item, remove, toggleInCart, updateText }: Props = $props()

  let confirming = $state(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  function handleDelete() {
    if (confirming) {
      confirming = false
      if (resetTimer) clearTimeout(resetTimer)
      remove()
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
  let longPressTimer: ReturnType<typeof setTimeout> | null = null

  function startLongPress() {
    longPressTimer = setTimeout(() => {
      editText = item.text
      editing = true
      setTimeout(() => inputEl?.focus(), 0)
    }, 500)
  }

  function cancelLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null }
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
</script>

<div
  class="flex min-h-12 w-full items-stretch overflow-hidden rounded-md border {editing ? 'border-blue-400' : 'border-input'} {item.inCart
    ? 'bg-slate-200'
    : 'bg-background'}"
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
      aria-pressed={item.inCart}
      onclick={toggleInCart}
      ontouchstart={startLongPress}
      ontouchend={cancelLongPress}
      ontouchcancel={cancelLongPress}
      onmousedown={startLongPress}
      onmouseup={cancelLongPress}
      onmouseleave={cancelLongPress}
    >
      <GripVertical class="mx-2 size-4 self-center text-slate-500" />

      <div class="flex w-full min-w-0 items-center justify-between gap-2">
        <span class="flex-1 truncate py-2 text-left"
          >{item.text}</span
        >
        <ShoppingBasket class="size-4 {item.inCart ? '' : 'invisible'}" />
      </div>
    </button>

    <button
      class="relative overflow-hidden px-4 text-slate-500"
      onclick={handleDelete}
    >
      <span
        class="absolute inset-0 bg-red-500 transition-transform duration-200 ease-out"
        style:transform={confirming ? 'translateX(0)' : 'translateX(100%)'}
      />
      <Trash2 class="relative z-10 size-4" />
    </button>
  {/if}
</div>
