<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Toggle } from '$lib/components/ui/toggle'
  import type { ItemType, Item, ItemsList } from './types.ts'

  import { onDestroy } from 'svelte'

  import {
    document as automergeDocument,
    setContextRepo
  } from '@automerge/automerge-repo-svelte-store'
  import { isValidAutomergeUrl, Repo } from '@automerge/automerge-repo'
  import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter()
    // network: new BroadcastChannelNetworkAdapter()
  })
  setContextRepo(repo)

  // const rootDocUrl = `${document.location.hash.substring(1)}`
  const rootDocUrl = 'automerge:4TMTVaus7QPg2HBRAc2wa47fD3k'
  let handle
  if (isValidAutomergeUrl(rootDocUrl)) {
    handle = repo.find(rootDocUrl)
  } else {
    handle = repo.create<ItemsList>({
      items: [
        {
          text: 'Learn Automerge',
          inCart: false,
          purchased: false,
          type: 'regular'
        }
      ]
    })
  }

  const docUrl = (document.location.hash = handle.url)
  const doc = automergeDocument<ItemsList>(docUrl)

  let items = $state<Item[]>([])
  let text = $state('')
  let activeTab = $state('regular')

  const unsubscribe = doc.subscribe(value => {
    if (value !== undefined) {
      items = value.items
    }
  })

  onDestroy(() => {
    unsubscribe()
  })

  function add(type: ItemType) {
    //TODO: handle the case in another way
    if (itemTexts.includes(text)) {
      text = ''
      return
    }

    let item = {
      text,
      type,
      purchased: false,
      inCart: type === 'rare' ? true : false
    }

    doc.change(d => d.items.push(item))
    text = ''
  }

  function toggleInCart(i: number) {
    doc.change(d => {
      if (i < 0 || i >= d.items.length) {
        return
      }

      d.items[i].inCart = !d.items[i].inCart
      d.items[i].purchased = false
    })
  }

  function togglePurchased(i: number) {
    doc.change(d => {
      if (i < 0 || i >= d.items.length) {
        return
      }

      d.items[i].purchased = !d.items[i].purchased
    })
  }

  let regularItems = $derived(items.filter(item => item.type === 'regular'))
  let cartItems = $derived(items.filter(item => item.inCart))
  let itemTexts = $derived(items.map(item => item.text))
</script>

<header class="border-b p-2">
  <h1 class="text-4xl font-extrabold tracking-tight">Hello!</h1>
</header>
<main class="container pt-2 sm:w-[350px]">
  <Tabs.Root bind:value={activeTab}>
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="regular">Regular Items</Tabs.Trigger>
      <Tabs.Trigger value="cart">Shopping Cart</Tabs.Trigger>
    </Tabs.List>
    <div class="mb-4 mt-4 flex flex-col gap-2">
      <Input
        bind:value={text}
        placeholder={`Add ${activeTab === 'regular' ? 'regular' : 'rare'} item`}
      />
      <Button
        disabled={!text.trim()}
        on:click={() => add(activeTab === 'regular' ? 'regular' : 'rare')}
        >Add</Button
      >
    </div>
    <Tabs.Content value="regular">
      <ul>
        {#each regularItems as item, index}
          <li>
            <Toggle
              variant="outline"
              class="mb-2 flex w-full items-center justify-between"
              bind:pressed={item.inCart}
              on:click={() => toggleInCart(index)}
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
    <Tabs.Content value="cart">
      {#each cartItems as item, index}
        <li class="mb-2 flex items-center gap-2">
          <Checkbox
            checked={item.purchased}
            onCheckedChange={() => togglePurchased(index)}
          />
          <span class={item.purchased ? 'line-through' : ''}>{item.text}</span>
        </li>
      {/each}
    </Tabs.Content>
  </Tabs.Root>
</main>
