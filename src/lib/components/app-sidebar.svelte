<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { getPagePath } from '@nanostores/router'
  import Command from 'lucide-svelte/icons/command'
  import House from 'lucide-svelte/icons/house'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import { router } from '$src/stores/router'
  import Trash2 from 'lucide-svelte/icons/trash-2'

  import { useSidebar } from '$lib/components/ui/sidebar/index.js'

  import { mainId, specialLists } from '$stores/docs'
  import Plus from 'lucide-svelte/icons/plus'
  import SidebarMenu from './ui/sidebar/sidebar-menu.svelte'

  interface Props {
    openRemoveDrawer: (id: string, name: string) => void
    openCreateDrawer: () => void
  }
  let { openRemoveDrawer, openCreateDrawer }: Props = $props()
  let sidebar = useSidebar()

  function toggleSidebarIfMobile() {
    if (sidebar.isMobile) {
      sidebar.toggle()
    }
  }

  function onRemove(id: string, name: string) {
    toggleSidebarIfMobile()
    openRemoveDrawer(id, name)
  }
  function onCreate() {
    toggleSidebarIfMobile()
    openCreateDrawer()
  }

  let items = $derived([
    {
      title: 'Home',
      url: getPagePath(router, 'start'),
      icon: House,
      isActive: false
    },
    ...($mainId
      ? [
          {
            title: 'The List',
            url: getPagePath(router, 'main', { id: $mainId }),
            icon: ListTodo
          }
        ]
      : [])
  ])
</script>

<Sidebar.Root class="border-r-0" variant="inset">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <div
                class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
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

      {#each items as item, i}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={item.isActive}
            size="lg"
            onclick={toggleSidebarIfMobile}
          >
            {#snippet child({ props })}
              <a href={item.url} {...props}>
                <item.icon />
                <span class="truncate leading-tight">{item.title}</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      {/each}
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Special Lists</Sidebar.GroupLabel>
      <Sidebar.GroupAction title="Add List" onclick={onCreate}>
        <Plus />
      </Sidebar.GroupAction>
      <Sidebar.GroupContent>
        <SidebarMenu>
          {#if $specialLists?.length > 0}
            {#each $specialLists as list, i}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton onclick={toggleSidebarIfMobile} size="lg">
                  {#snippet child({ props })}
                    <a
                      href={getPagePath(router, 'special', { id: list.id })}
                      {...props}
                    >
                      <ListTodo />
                      <span class="truncate leading-tight">{list.name}</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>

                <Sidebar.MenuAction
                  title="Remove List"
                  onclick={() => onRemove(list.id, list.name)}
                >
                  <Trash2 />
                </Sidebar.MenuAction>
              </Sidebar.MenuItem>
            {/each}
          {:else}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton size="lg">
                <span>No special list yet</span>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/if}
        </SidebarMenu>
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
