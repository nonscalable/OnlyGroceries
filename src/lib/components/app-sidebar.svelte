<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import { getPagePath } from '@nanostores/router'
  import Command from 'lucide-svelte/icons/command'
  import House from 'lucide-svelte/icons/house'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import { router } from '$src/stores/router'

  import { useSidebar } from '$lib/components/ui/sidebar/index.js'

  import { mainId, specialLists } from '$stores/docs'
  import Plus from 'lucide-svelte/icons/plus'
  import SidebarMenu from './ui/sidebar/sidebar-menu.svelte'

  interface Props {
    isDrawerOpen: boolean
  }
  let { isDrawerOpen = $bindable() } = $props()
  let sidebar = useSidebar()

  function createSpecialList() {
    isDrawerOpen = !isDrawerOpen
    sidebar.toggle()
  }

  let items = [
    {
      title: 'Home',
      url: getPagePath(router, 'start'),
      icon: House,
      isActive: false
    },
    {
      title: 'The List',
      url: $mainId ? getPagePath(router, 'main', { id: $mainId }) : null,
      icon: ListTodo,
      isActive: false
    }
  ]
</script>

<Sidebar.Root class="border-r-0">
  <Sidebar.Header>
    <div class="mb-4 flex gap-2">
      <div
        class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
      >
        <Command class="size-4" />
      </div>
      <div class="grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-semibold">OnlyGroceries</span>
        <span class="truncate text-xs">1.0.0</span>
      </div>
    </div>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Menu>
      {#each items.filter(item => item.url) as item (item.title)}
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={item.isActive}
            size="lg"
            onclick={() => sidebar.toggle()}
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

    <Sidebar.Group>
      <Sidebar.GroupLabel>Special Lists</Sidebar.GroupLabel>
      <Sidebar.GroupAction title="Add List" onclick={createSpecialList}>
        <Plus /> <span class="sr-only">Add Project</span>
      </Sidebar.GroupAction>
      <Sidebar.GroupContent>
        <SidebarMenu>
          {#if $specialLists.length != 0}
            {#each $specialLists as list, i}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton size="lg" onclick={() => sidebar.toggle()}>
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
        <Sidebar.MenuButton size="lg" onclick={() => sidebar.toggle()}>
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
