<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import * as Sheet from '$lib/components/ui/sheet'
  import * as Drawer from '$lib/components/ui/drawer'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'

  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Toggle } from '$lib/components/ui/toggle'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import FolderSync from 'lucide-svelte/icons/folder-sync'

  import type { ItemType, Item, ItemsList } from './types.ts'

  import { onDestroy } from 'svelte'

  import {
    document as automergeDocument,
    setContextRepo
  } from '@automerge/automerge-repo-svelte-store'
  import { Repo } from '@automerge/automerge-repo'
  import type { AutomergeUrl } from 'node_modules/@automerge/automerge-repo/dist/types'

  import { router } from './router'

  interface MyProps {
    docUrl: AutomergeUrl
    repo: Repo
  }

  let { docUrl, repo }: MyProps = $props()
  setContextRepo(repo)

  let doc = automergeDocument<ItemsList>(docUrl)

  let items = $state<Item[]>([])
  let text = $state('')
  let activeTab = $state<ItemType>('regular')

  const unsubscribe = doc.subscribe(value => {
    if (value !== undefined) {
      items = value.items
    }
  })

  onDestroy(() => {
    unsubscribe()
  })

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

  let sharedUrl = $state('')
  async function copyUrl() {
    await navigator.share({
      // title: 'Your Automerge ID',
      text: docUrl,
      url: 'heh.ru'
    })
  }

  let joinUrl = $state('')
  function join() {
    //try to  join

    //close all drawers
    isJoinDrawerOpen = !isJoinDrawerOpen

    //navigate too new list

    // const handle = repo.find<ItemsList>(joinUrl as AutomergeUrl)
    // const audoc = handle.docSync()
    // if (audoc) {
    //   items = audoc.items
    // }
    joinUrl = ''
  }

  let regularItems = $derived(
    items
      .map((item, i) => ({ ...item, i }))
      .filter(item => item.type === 'regular')
  )
  let cartItems = $derived(
    items.map((item, i) => ({ ...item, i })).filter(item => item.inCart)
  )
  let itemTexts = $derived(items.map(item => item.text))

  function handleKeydown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter') {
      action()
    }
  }
  let isJoinDrawerOpen = $state(false)
  let isDropdownOpen = $state(false)
</script>

<header class="flex flex-row justify-between border-b p-2">
  <Sheet.Root>
    <Sheet.Trigger>
      <Button variant="ghost" size="icon"><SquareMenu class="h-5 w-5" /></Button
      >
    </Sheet.Trigger>
    <Sheet.Content side="left" class="flex flex-col justify-center">
      <nav class="flex flex-col gap-2 p-4 pt-0">
        <Button variant="link" href="/" class="flex flex-col items-start">
          Home
        </Button>
        <Button
          variant="link"
          href="/occasional"
          class="flex flex-col items-start">Occasional</Button
        >
      </nav>
    </Sheet.Content>
  </Sheet.Root>

  <h1 class="text-4xl font-extrabold tracking-tight">Hello!</h1>

  <DropdownMenu.Root
    open={isDropdownOpen}
    onOpenChange={() => (isDropdownOpen = !isDropdownOpen)}
  >
    <DropdownMenu.Trigger>
      <Button variant="ghost" size="icon" class="justify-self-end">
        <FolderSync class="h-5 w-5" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content side="bottom" align="end">
      <DropdownMenu.Label>Options</DropdownMenu.Label>
      <DropdownMenu.Separator />

      <DropdownMenu.Item onclick={copyUrl}>
        <span>Invite</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        onclick={() => {
          isDropdownOpen = false
          isJoinDrawerOpen = true
        }}
      >
        <span>Join</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item disabled>
        <span>Sync</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <Drawer.Root
    open={isJoinDrawerOpen}
    onOpenChange={() => (isJoinDrawerOpen = !isJoinDrawerOpen)}
  >
    <Drawer.Content>
      <div class="mx-auto mb-4 w-full max-w-sm">
        <Drawer.Header>
          <Drawer.Title class="mb-4">Join</Drawer.Title>
          <Drawer.Description>Paste the ID from your inviter</Drawer.Description
          >
        </Drawer.Header>

        <div class="flex flex-col gap-3 p-4">
          <Input
            type="text"
            class="text-md"
            bind:value={joinUrl}
            onkeydown={e => handleKeydown(e, join)}
          />
          <Button onclick={join}>Submit</Button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Root>
</header>

<main class="container pt-2 sm:w-[350px]">
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
</main>
