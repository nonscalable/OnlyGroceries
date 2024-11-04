<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import { type AutomergeUrl } from '@automerge/automerge-repo/slim'
  import type { GroceryData, ItemType } from './types.ts'
  import { addAutomergePrefix } from './utils'
  import { nanoid } from 'nanoid'
  import Item from './Item.svelte'
  import { onMount } from 'svelte'
  import Sortable from 'sortablejs'
  interface Props {
    id: string
  }
  let { id }: Props = $props()

  let docUrl = addAutomergePrefix(id)
  let doc = document<GroceryData>(docUrl as AutomergeUrl)

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
  let sortable: HTMLUListElement
  onMount(function () {
    Sortable.create(sortable, {
      sort: true,
      // handle: '.grab',
      onEnd: handleSort,
      animation: 200,
      direction: 'vertical',
      forceFallback: false,
      delay: 50,
      delayOnTouchOnly: true
    })
  })
  function handleSort(e: Sortable.SortableEvent) {
    if (e.oldIndex === undefined || e.newIndex === undefined) {
      return
    }
    let oldId = regularIds[e.oldIndex]

    doc.change(d => {
      let oldPos = d.ids.findIndex(v => v === oldId)
      let [movedItem] = d.ids.splice(oldPos, 1)

      let currPos =
        e.newIndex !== undefined && e.newIndex < d.ids.length
          ? e.newIndex
          : d.ids.length

      d.ids.splice(currPos, 0, movedItem)
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
      <ul bind:this={sortable}>
        {#each regularIds as id, i (id)}
          <Item docUrl={docUrl as AutomergeUrl} {id} />
        {/each}
      </ul></Tabs.Content
    >
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
