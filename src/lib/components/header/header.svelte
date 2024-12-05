<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { router } from '$stores/router'
  import HeaderDrawer from './header-drawer.svelte'
  import HeaderSheet from './header-sheet.svelte'
  type Props = {
    mainId?: string
  }
  let { mainId }: Props = $props()

  async function invite() {
    await navigator.share({
      text: mainId
    })
  }

  let isJoinDrawerOpen = $state(false)
  let isDropdownOpen = $state(false)

  const date = new Date()
  const formattedDate = `${date.getDate()}.${date.getMonth() + 1}`
</script>

<header class="border-b p-2">
  <div class="mx-auto grid grid-cols-3 sm:w-[350px]">
    <HeaderSheet {mainId} />

    <h1 class="justify-self-center text-4xl font-extrabold tracking-tight">
      {formattedDate}
    </h1>

    {#if $router?.route === 'main'}
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
