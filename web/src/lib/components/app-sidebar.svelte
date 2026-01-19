<script lang="ts">
  import * as Sidebar from './ui/sidebar/index.js'
  import { useSidebar } from './ui/sidebar/index.js'

  import Command from 'lucide-svelte/icons/command'
  import House from 'lucide-svelte/icons/house'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import Plus from 'lucide-svelte/icons/plus'

  import { router } from '$stores/router'
  import { removeDrawer } from '$stores/remove-drawer.svelte'
  import { createDrawer } from '$stores/create-drawer.svelte'

  import { getPagePath } from '@nanostores/router'
  import { type AutomergeDocumentStore } from '@automerge/automerge-repo-svelte-store'
  import type { Root } from '$src/lib/core/types.js'

  interface Props {
    rootDoc: AutomergeDocumentStore<Root> | null
  }
  const { rootDoc }: Props = $props()

  let sidebar = useSidebar()

  function toggleSidebarIfMobile() {
    if (sidebar.isMobile) {
      sidebar.toggle()
    }
  }
  function onCreate() {
    toggleSidebarIfMobile()
    createDrawer.open()
  }
  function onRemove(id: string, name: string) {
    removeDrawer.specialList = { id, name }
    toggleSidebarIfMobile()
    removeDrawer.open()
  }
</script>

{#if $rootDoc}
  <Sidebar.Root class="border-r-0" variant="inset">
    <Sidebar.Header class="pt-safe">
      <Sidebar.Menu>
        <!-- Logo -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            size="lg"
            isActive={$router?.route === 'peers'}
            onclick={toggleSidebarIfMobile}
          >
            {#snippet child({ props })}
              <a href={getPagePath(router, 'peers')} {...props}>
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">OnlyGroceries</span>
                  <span class="truncate text-xs">1.0.0</span>
                </div>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- Home -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            size="lg"
            isActive={$router?.route === 'main'}
            onclick={toggleSidebarIfMobile}
          >
            {#snippet child({ props })}
              <a href={getPagePath(router, 'main')} {...props}>
                <House />
                <span class="truncate leading-tight">Main</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <!-- Special Lists -->
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Special Lists</Sidebar.GroupLabel>
        <Sidebar.GroupAction title="Add List" onclick={onCreate}>
          <Plus />
        </Sidebar.GroupAction>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#if $rootDoc}
              {@const specialLists = $rootDoc.specials.order}
              {#if specialLists.length > 0}
                {#each specialLists as listId, it}
                  {@const listName = $rootDoc.specials.lists[listId].name}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      size="lg"
                      onclick={toggleSidebarIfMobile}
                      isActive={$router?.route == 'special' &&
                        $router.params.id == listId}
                    >
                      {#snippet child({ props })}
                        <a
                          href={getPagePath(router, 'special', { id: listId })}
                          {...props}
                        >
                          <ListTodo />
                          <span class="truncate leading-tight">{listName}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>

                    <Sidebar.MenuAction
                      title="Remove List"
                      onclick={() => onRemove(listId, listName)}
                    >
                      <Trash2 />
                    </Sidebar.MenuAction>
                  </Sidebar.MenuItem>
                {/each}
              {:else}
                <Sidebar.MenuItem
                  class="text-sidebar-foreground/65 text-center text-xs italic leading-10"
                >
                  No special lists yet
                </Sidebar.MenuItem>
              {/if}
            {/if}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer class="mb-5">
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" onclick={toggleSidebarIfMobile}>
            {#snippet child({ props })}
              <a href={getPagePath(router, 'settings')} {...props}>
                <Settings />
                <span class="truncate leading-tight">Settings</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}
