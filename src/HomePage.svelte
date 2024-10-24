<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Toggle } from '$lib/components/ui/toggle'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import { type AutomergeUrl } from '@automerge/automerge-repo/slim'
  import type { ItemType, ItemsList } from './types.ts'
  import { addAutomergePrefix } from './utils'
  interface Props {
    id: string
  }
  let { id }: Props = $props()

  let docUrl = addAutomergePrefix(id)
  let doc = document<ItemsList>(docUrl as AutomergeUrl)

  let regularItems = $derived(
    $doc?.items
      .map((item, i) => ({ ...item, i }))
      .filter(item => item.type === 'regular')
  )
  let cartItems = $derived(
    $doc?.items.map((item, i) => ({ ...item, i })).filter(item => item.inCart)
  )
  let itemTexts = $derived($doc?.items.map(item => item.text))

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

    doc.change(d => d.items.push(item))
    text = ''
  }

  function toggleInCart(i: number) {
    doc.change(d => {
      d.items[i].inCart = !d.items[i].inCart
      d.items[i].purchased = false
    })
  }

  function togglePurchased(i: number) {
    doc.change(d => {
      d.items[i].purchased = !d.items[i].purchased
    })
  }

  function handleKeydown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter') {
      action()
    }
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
      <ul>
        {#each regularItems as item (item.i)}
          <li>
            <Toggle
              variant="default"
              class="mb-2 flex w-full items-center justify-between"
              pressed={item.inCart}
              onclick={() => toggleInCart(item.i)}
            >
              <div class="flex items-center gap-2">
                <span>{item.text}</span>
              </div>

              <span class=" text-sm text-gray-500">
                {item.inCart ? 'In Cart' : ''}
              </span>
            </Toggle>
          </li>
        {/each}
      </ul>
    </Tabs.Content>
    <Tabs.Content value="rare">
      {#each cartItems as item (item.i)}
        <li class="mb-2 flex items-center gap-2">
          <Checkbox
            checked={item.purchased}
            onCheckedChange={() => togglePurchased(item.i)}
          />
          <span class={item.purchased ? 'line-through' : ''}>{item.text}</span>
        </li>
      {/each}
    </Tabs.Content>
  </Tabs.Root>
</div>
