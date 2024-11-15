<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet'
  import * as Drawer from '$lib/components/ui/drawer'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import Button, {
    buttonVariants
  } from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { storeAutomergeKey } from '../../idb'
  import { addAutomergePrefix } from '../../utils'
  import { getPagePath, openPage } from '@nanostores/router'
  import { router } from '../../stores/router'
  import { isValidAutomergeUrl } from '@automerge/automerge-repo'
  import { mainId } from '../../stores/docs'

  // TODO: copy text if web?
  async function invite() {
    if ($router && $router.route === 'main') {
      await navigator.share({
        text: $router.params.id
      })
    }
  }

  let joinUrl = $state('')
  let showMessage = $state(false)
  async function join() {
    //TODO: check if its the same automerge url that already exist on this peer
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

  function goToStart() {
    openPage(router, 'start')
    isSheetOpen = false
  }
  function goToMain(id: string) {
    openPage(router, 'main', { id: id })
    isSheetOpen = false
  }

  let isJoinDrawerOpen = $state(false)
  let isDropdownOpen = $state(false)
  let isSheetOpen = $state(false)
</script>

<header class="border-b p-2">
  <div class="mx-auto grid grid-cols-3 sm:w-[350px]">
    <Sheet.Root bind:open={isSheetOpen}>
      <Sheet.Trigger
        class="justify-self-start {buttonVariants({
          variant: 'ghost',
          size: 'icon'
        })} [&_svg]:size-5"
      >
        <SquareMenu />
      </Sheet.Trigger>
      <Sheet.Content side="left" class="flex flex-col justify-center">
        <nav class="flex flex-col gap-2 p-4 pt-0">
          <Button
            variant="link"
            class="onclick flex flex-col items-start"
            onclick={goToStart}>Start</Button
          >
          {#if $mainId}
            <Button
              onclick={() => goToMain($mainId)}
              variant="link"
              class="flex flex-col items-start">Main</Button
            >
          {/if}

          <Button variant="link" disabled class="flex flex-col items-start"
            >Special (WIP)</Button
          >
        </nav>
      </Sheet.Content>
    </Sheet.Root>

    <h1 class="justify-self-center text-4xl font-extrabold tracking-tight">
      Hello!
    </h1>

    {#if $router?.route !== 'start'}
      <!-- FIXME: Figure out icons sizes (get rid of [&_svg]:size-5) -->
      <DropdownMenu.Root bind:open={isDropdownOpen}>
        <DropdownMenu.Trigger
          class="justify-self-end {buttonVariants({
            variant: 'ghost',
            size: 'icon'
          })} [&_svg]:size-5"
        >
          <FolderSync />
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
            <span>Sync (WIP)</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
</header>

<Drawer.Root bind:open={isJoinDrawerOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4">Join</Drawer.Title>
        <Drawer.Description>Paste the ID from your inviter</Drawer.Description>
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
