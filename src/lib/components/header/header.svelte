<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import Button, {
    buttonVariants
  } from '$lib/components/ui/button/button.svelte'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { openPage } from '@nanostores/router'
  import { router, type RouteName } from '$stores/router'
  import { mainId } from '$stores/docs'
  import HeaderDrawer from './header-drawer.svelte'

  // TODO: copy text if web?
  async function invite() {
    if ($router && $router.route === 'main') {
      await navigator.share({
        text: $router.params.id
      })
    }
  }

  function goTo(name: RouteName, params = {}) {
    openPage(router, name, params)
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
            class="flex flex-col items-start"
            onclick={() => goTo('start')}>Start</Button
          >

          {#if $mainId}
            <Button
              onclick={() => goTo('main', { id: $mainId })}
              variant="link"
              class="flex flex-col items-start">Main</Button
            >
          {/if}

          <Button
            onclick={() => goTo('settings')}
            variant="link"
            class="flex flex-col items-start">Settings</Button
          >

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

<HeaderDrawer bind:isOpen={isJoinDrawerOpen} />
