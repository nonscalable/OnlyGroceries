<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet'
  import * as Drawer from '$lib/components/ui/drawer'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { getContext } from 'svelte'
  import { storeAutomergeKey } from './idb'
  import { addAutomergePrefix, stripAutomergePrefix } from './utils'
  import { openPage } from '@nanostores/router'
  import { router } from './stores/router'
  import { isValidAutomergeUrl } from '@automerge/automerge-repo'

  const docUrl = getContext('docUrl')

  async function invite() {
    await navigator.share({
      text: stripAutomergePrefix(docUrl as string)
    })
  }

  let joinUrl = $state('')
  let showMessage = $state(false)
  async function join() {
    if (!isValidAutomergeUrl(addAutomergePrefix(joinUrl))) {
      showMessage = true
      return
    }

    await storeAutomergeKey(joinUrl)

    openPage(router, 'main', { id: joinUrl })
    isJoinDrawerOpen = !isJoinDrawerOpen

    joinUrl = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      join()
    }
  }

  let isJoinDrawerOpen = $state(false)
  let isDropdownOpen = $state(false)
  let isSheetOpen = $state(false)
</script>

<header class="flex flex-row justify-between border-b p-2">
  <Sheet.Root bind:open={isSheetOpen}>
    <Sheet.Trigger>
      <Button variant="ghost" size="icon"><SquareMenu class="h-5 w-5" /></Button
      >
    </Sheet.Trigger>
    <Sheet.Content side="left" class="flex flex-col justify-center">
      <nav class="flex flex-col gap-2 p-4 pt-0">
        <Button
          href="/"
          variant="link"
          class="onclick flex flex-col items-start"
          onclick={() => (isSheetOpen = false)}>Start</Button
        >
        <Button variant="link" disabled class="flex flex-col items-start"
          >Main (WIP)</Button
        >
        <Button variant="link" disabled class="flex flex-col items-start"
          >Special (WIP)</Button
        >
      </nav>
    </Sheet.Content>
  </Sheet.Root>

  <h1 class="text-4xl font-extrabold tracking-tight">Hello!</h1>

  <DropdownMenu.Root bind:open={isDropdownOpen}>
    <DropdownMenu.Trigger>
      <Button variant="ghost" size="icon" class="justify-self-end">
        <FolderSync class="h-5 w-5" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content side="bottom" align="end">
      <DropdownMenu.Label>Options</DropdownMenu.Label>
      <DropdownMenu.Separator />

      <DropdownMenu.Item onclick={invite}>
        <span>Invite</span>
      </DropdownMenu.Item>

      <DropdownMenu.Item
        onclick={() => {
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

  <Drawer.Root bind:open={isJoinDrawerOpen}>
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
            onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
          />
          <p
            class="h-5 text-sm text-red-700 transition-opacity"
            class:opacity-100={showMessage}
            class:opacity-0={!showMessage}
          >
            You have to enter valid ID
          </p>
          <Button onclick={join}>Submit</Button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Root>
</header>
