<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { document as automergeDocument } from '@automerge/automerge-repo-svelte-store'
  import { type AutomergeUrl } from '@automerge/automerge-repo/slim'
  import type { GroceryData, ItemType } from './types.ts'
  import { addAutomergePrefix } from './utils'
  import { nanoid } from 'nanoid'
  import Item from './Item.svelte'
  import Sortable, { type SortableEvent } from 'sortablejs'
  import { sortable } from './sortable'
  interface Props {
    id: string
  }
  let { id }: Props = $props()

  let docUrl = addAutomergePrefix(id)
  let doc = automergeDocument<GroceryData>(docUrl as AutomergeUrl)

  let regularIds = $derived(
    $doc.ids.filter(id => $doc.items[id].type === 'regular')
  )
  let cartIds = $derived($doc.ids.filter(id => $doc.items[id].inCart))
  let itemTexts = $derived($doc.ids.map(id => $doc.items[id].text))

  let activeTab = $state<ItemType>('regular')
  let text = $state('')
  let showMessage = $state(false)

  function add() {
    if (!text) {
      showMessage = true
      return
    }

    let item = {
      text,
      type: activeTab,
      purchased: false,
      inCart: activeTab === 'rare' ? true : false
    }
    let id = nanoid()

    doc.change(d => {
      d.items[id] = item
      d.ids.push(id)
    })
    text = ''
  }

  function togglePurchased(id: string) {
    doc.change(d => {
      d.items[id].purchased = !d.items[id].purchased
    })
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      add()
    }
  }

  const options: Sortable.SortableOptions = {
    animation: 200,
    onEnd: handleSort,
    forceFallback: false,
    delay: 50,
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
  <Tabs.Root bind:value={activeTab}>
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="regular">Regular Items</Tabs.Trigger>
      <Tabs.Trigger value="rare">Shopping Cart</Tabs.Trigger>
    </Tabs.List>
    <div class="mb-4 mt-4 flex flex-col gap-1">
      <Input
        autofocus
        class="text-md focus-visible:ring-offset-1"
        bind:value={text}
        onkeydown={e => handleKeydown(e)}
        oninput={() => (showMessage = false)}
        placeholder={`Add ${activeTab} item`}
        required
      />
      <p
        class="h-5 text-sm text-red-700 transition-opacity"
        class:opacity-100={showMessage}
        class:opacity-0={!showMessage}
      >
        You have to enter something
      </p>
      <Button onclick={add} size="lg">Add</Button>
    </div>

    <Tabs.Content value="regular">
      {#key $doc.ids}
        <ul use:sortable={options}>
          {#each regularIds as id, i (id)}
            <Item docUrl={docUrl as AutomergeUrl} {id} />
          {/each}
        </ul>
      {/key}
    </Tabs.Content>
    <Tabs.Content value="rare">
      {#each cartIds as id, index}
        <li class="mb-2 flex items-center gap-2">
          <Checkbox
            checked={$doc.items[id].purchased}
            onCheckedChange={() => togglePurchased(id)}
          />
          <span class={$doc.items[id].purchased ? 'line-through' : ''}
            >{$doc.items[id].text}</span
          >
        </li>
      {/each}
    </Tabs.Content>
  </Tabs.Root>
</div>
