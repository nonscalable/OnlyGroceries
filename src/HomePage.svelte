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
  import { SortableList } from '@jhubbardsf/svelte-sortablejs'
  import { nanoid } from 'nanoid'
  import Item from './Item.svelte'
  interface Props {
    id: string
  }
  let { id }: Props = $props()

  let docUrl = addAutomergePrefix(id)
  let doc = document<GroceryData>(docUrl as AutomergeUrl)

  let regularIds = $derived(
    $doc?.ids.filter(id => $doc.items[id].type === 'regular')
  )
  let cartIds = $derived($doc?.ids.filter(id => $doc.items[id].inCart))
  let itemTexts = $derived($doc.ids.map(id => $doc.items[id].text))

  let text = $state('')
  let activeTab = $state<ItemType>('regular')

  function add() {
    //TODO: handle the case in another way
    if (itemTexts.includes(text)) {
      text = ''
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

  function handleKeydown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter') {
      action()
    }
  }

  function handleSort(old: number, curr: number) {
    let oldId = regularIds[old]
    let currId = regularIds[curr]

    doc.change(d => {
      let oldPos = d.ids.findIndex(v => v === oldId)
      let currPos = d.ids.findIndex(v => v === currId)

      ;[d.ids[oldPos], d.ids[currPos]] = [d.ids[currPos], d.ids[oldPos]]
    })
  }
</script>

<div class="container pt-2 sm:w-[350px]">
  <Tabs.Root bind:value={activeTab}>
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="regular">Regular Items</Tabs.Trigger>
      <Tabs.Trigger value="rare">Shopping Cart</Tabs.Trigger>
    </Tabs.List>
    <div class="mb-4 mt-4 flex flex-col gap-2">
      <Input
        autofocus
        class="text-md"
        bind:value={text}
        onkeydown={e => handleKeydown(e, add)}
        placeholder={`Add ${activeTab} item`}
      />
      <Button disabled={!text.trim()} onclick={add}>Add</Button>
    </div>

    <Tabs.Content value="regular">
      <SortableList
        class="list-group"
        handle=".cursor-grab"
        animation={150}
        onEnd={e => handleSort(e.oldIndex, e.newIndex)}
      >
        {#each regularIds as itemId (itemId)}
          <Item docUrl={docUrl as AutomergeUrl} id={itemId} />
        {/each}
      </SortableList>
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
