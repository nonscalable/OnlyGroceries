<script lang="ts">
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import SpecialItem from '$lib/components/special-item.svelte'

  import { nanoid } from 'nanoid'
  import { sortable } from '../sortable'
  import Sortable, { type SortableEvent } from 'sortablejs'

  import { g } from '$stores/global.svelte'
  import { toast } from 'svelte-sonner'

  interface Props {
    id: string
  }
  let { id: docID }: Props = $props()
  let title = $derived(
    g.rootDoc?.state.specialInfos.find(info => info.id === docID)?.name
  )
  let doc = $derived(g.specialDocs[docID])
  let text = $state('')

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      toast.error('You have to type something')
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

<div class="container pt-2">
  <h1 class="text-3xl font-bold">{title}</h1>
  <div class="mb-4 mt-4 flex flex-col gap-1">
    <Input
      class="text-md focus-visible:ring-offset-1"
      bind:value={text}
      onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
      required
    />

    <Button class="mt-3" onclick={add} size="lg">Add</Button>
  </div>

  {#key doc?.state.ids}
    <ul use:sortable={options} class="grid gap-2">
      {#if doc?.state && doc.state.ids}
        {#each doc.state.ids as id (id)}
          <li>
            <SpecialItem item={doc.state.items[id]} {docID} {id} />
          </li>
        {/each}
      {/if}
    </ul>
  {/key}
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
