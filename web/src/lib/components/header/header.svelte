<script lang="ts">
  import { toast } from 'svelte-sonner'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
  import { buttonVariants } from '$lib/components/ui/button/button.svelte'
  import FolderSync from 'lucide-svelte/icons/folder-sync'
  import { router } from '$stores/router'
  import HeaderDrawer from './header-drawer.svelte'
  import SidebarTrigger from '../ui/sidebar/sidebar-trigger.svelte'

  async function invite(id: string) {
    if (navigator.share) {
      await navigator.share({
        text: id
      })
    } else {
      await navigator.clipboard.writeText(id)
      toast.success('List ID has been copied to clipboard', {
        description: 'Send it to your friend'
      })
    }
  }

  let isJoinDrawerOpen = $state(false)
  let isDropdownOpen = $state(false)

  const date = new Date()
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
</script>

<!-- TODO: refactor header-drawer and header-sheet-drawer to make one component with different content -->
<header class="border-b p-2">
  <div class="grid grid-cols-3">
    <SidebarTrigger
      class="justify-self-start {buttonVariants({
        variant: 'ghost',
        size: 'icon'
      })} [&_svg]:size-5"
    />

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

          <DropdownMenu.Item onclick={() => invite($router.params.id)}>
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
