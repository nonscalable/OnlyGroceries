<script lang="ts">
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import type { SpecialListData } from '$src/types'
  import { addAutomergePrefix } from '$src/utils'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import type { AutomergeUrl } from '@automerge/automerge-repo'
  import { nanoid } from 'nanoid'
  import SpecialItem from '$src/lib/components/special-item.svelte'
  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from '../sortable'

  interface Props {
    id: string
  }
  let { id }: Props = $props()
  let docUrl = addAutomergePrefix(id) as AutomergeUrl
  let doc = document<SpecialListData>(docUrl)

  let text = $state('')
  let message = $state('')
  let showMessage = $state(false)
  let itemTexts = $derived(
    $doc.ids.map(id => $doc.items[id].text.toLowerCase())
  )

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      message = 'You have to type something'
      showMessage = true
      return
    }

    if (itemTexts.includes(formatted)) {
      message = 'Item is already in the list'
      showMessage = true

      return
    }

    let item = {
      text: text.trim(),
      purchased: false
    }
    let id = nanoid()
    doc.change(d => {
      d.items[id] = item
      d.ids.push(id)
    })

    text = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      add()
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

    doc.change(d => {
      const [movedItem] = d.ids.splice(oldIndex, 1)
      d.ids.splice(newIndex, 0, movedItem)
    })
  }
</script>

<div class="container pt-2 sm:w-[350px]">
  <div class="mb-4 mt-4 flex flex-col gap-1">
    <Input
      class="text-md focus-visible:ring-offset-1"
      bind:value={text}
      onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
      oninput={() => (showMessage = false)}
      required
    />
    <p
      class="h-5 text-sm text-red-700 transition-opacity"
      class:opacity-100={showMessage}
      class:opacity-0={!showMessage}
    >
      {message}
    </p>
    <Button onclick={add} size="lg">Add</Button>
  </div>

  <ul use:sortable={options} class="grid gap-2">
    {#each $doc.ids as id (id)}
      <SpecialItem item={$doc.items[id]} {docUrl} {id} />
    {/each}
  </ul>
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
