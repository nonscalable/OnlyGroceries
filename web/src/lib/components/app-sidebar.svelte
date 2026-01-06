<script lang="ts">
  import * as Sidebar from './ui/sidebar/index.js'
  import { useSidebar } from './ui/sidebar/index.js'

  import Command from 'lucide-svelte/icons/command'
  import House from 'lucide-svelte/icons/house'
  import Star from 'lucide-svelte/icons/star'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import Plus from 'lucide-svelte/icons/plus'

  import { router } from '$stores/router'
  import { removeDrawer } from '$stores/remove-drawer.svelte'
  import { createDrawer } from '$stores/create-drawer.svelte'
  import { g } from '$stores/global.svelte'

  import { getPagePath } from '@nanostores/router'

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
  function onRemove(id: string, name: string, type: 'main' | 'special') {
    removeDrawer.listId = id
    removeDrawer.listName = name
    removeDrawer.listType = type
    toggleSidebarIfMobile()
    removeDrawer.open()
  }
</script>

<Sidebar.Root class="border-r-0" variant="inset">
  <Sidebar.Header class="pt-safe">
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="##" {...props}>
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

      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          size="lg"
          isActive={$router?.route === 'home'}
          onclick={toggleSidebarIfMobile}
        >
          {#snippet child({ props })}
            <a href={getPagePath(router, 'home')} {...props}>
              <House />
              <span class="truncate leading-tight">Home</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>

      {#if g.mainDoc?.state}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            size="lg"
            isActive={$router?.route === 'main'}
            onclick={toggleSidebarIfMobile}
          >
            {#snippet child({ props })}
              <a
                href={getPagePath(router, 'main', {
                  id: g.mainDoc?.handle.documentId as string
                })}
                {...props}
              >
                <Star />
                <span class="truncate leading-tight">The List</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
          <Sidebar.MenuAction
            title="Remove List"
            onclick={() =>
              onRemove(
                g.mainDoc?.handle.documentId as string,
                'The List',
                'main'
              )}
          >
            <Trash2 />
          </Sidebar.MenuAction>
        </Sidebar.MenuItem>
      {/if}
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Special Lists</Sidebar.GroupLabel>
      <Sidebar.GroupAction title="Add List" onclick={onCreate}>
        <Plus />
      </Sidebar.GroupAction>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#await g.rootDoc?.handle.whenReady() then _}
            {#if g.rootDoc?.state?.specialInfos}
              {@const specialLists = g.rootDoc.state.specialInfos}
              {#if specialLists.length > 0}
                {#each specialLists as list, i}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      size="lg"
                      onclick={toggleSidebarIfMobile}
                      isActive={$router?.route === 'special' &&
                        $router.params.id === list.id}
                    >
                      {#snippet child({ props })}
                        <a
                          href={getPagePath(router, 'special', { id: list.id })}
                          {...props}
                        >
                          <ListTodo />
                          <span class="truncate leading-tight">{list.name}</span
                          >
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>

                    <Sidebar.MenuAction
                      title="Remove List"
                      onclick={() => onRemove(list.id, list.name, 'special')}
                    >
                      <Trash2 />
                    </Sidebar.MenuAction>
                  </Sidebar.MenuItem>
                {/each}
              {/if}
            {:else}
              <Sidebar.MenuItem
                class="text-sidebar-foreground/65 text-center text-xs italic leading-10"
              >
                No special lists yet
              </Sidebar.MenuItem>
            {/if}
          {/await}
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
