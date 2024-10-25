<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet'
  import * as Drawer from '$lib/components/ui/drawer'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { getContext } from 'svelte'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import { router } from './stores/router'
  import { getPagePath, openPage } from '@nanostores/router'
  import { storeAutomergeKey } from './idb'
  import { stripAutomergePrefix } from './utils'

  const docUrl = getContext('docUrl')
  const repo = getContextRepo()

  async function invite() {
    await navigator.share({
      text: stripAutomergePrefix(docUrl as string)
    })
  }

  let joinUrl = $state('')
  async function join() {
    await storeAutomergeKey(joinUrl)

    router.open(`/home#${joinUrl}`)

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
</script>

<header class="flex flex-row justify-between border-b p-2">
  <Sheet.Root>
    <Sheet.Trigger>
      <Button variant="ghost" size="icon"><SquareMenu class="h-5 w-5" /></Button
      >
    </Sheet.Trigger>
    <Sheet.Content side="left" class="flex flex-col justify-center">
      <nav class="flex flex-col gap-2 p-4 pt-0">
        <Button
          variant="link"
          href={getPagePath(router, 'start')}
          class="flex flex-col items-start"
        >
          Start
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

      <DropdownMenu.Item onclick={invite}>
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
            onkeydown={e => handleKeydown(e)}
          />
          <Button href="/home" onclick={join}>Submit</Button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Root>
</header>
