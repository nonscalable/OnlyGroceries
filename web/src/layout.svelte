<!-- TODO: figure out if its ok to call repo.find and .whenReady everytime -->

<script lang="ts">
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './lib/components/header/header.svelte'
  import Main from './pages/main.svelte'
  import { Repo, type AutomergeUrl } from '@automerge/automerge-repo'
  import { addAutomergePrefix } from './utils'
  import { router } from './stores/router'
  import Start from './pages/start.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import AppSidebar from '$src/lib/components/app-sidebar.svelte'

  import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
  import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
  import PwaBadge from '$lib/components/pwa-badge.svelte'
  import { openPage } from '@nanostores/router'
  import { mainId } from './stores/docs'
  import Settings from './pages/settings.svelte'
  import Special from './pages/special.svelte'
  import CreateDrawer from './lib/components/create-drawer.svelte'
  import RemoveDrawer from './lib/components/remove-drawer.svelte'

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    // network: [new BrowserWebSocketClientAdapter('wss://sync.automerge.org')]
    network: [new BrowserWebSocketClientAdapter('ws://localhost:8080?access-token=og')]
  })

  setContextRepo(repo)

  if ($mainId) {
    openPage(router, 'main', { id: $mainId })
  }

  function getHandle(id: string) {
    return repo.find(addAutomergePrefix(id) as AutomergeUrl)
  }
  let open = $state(true)
  let isCreateDrawerOpen = $state(false)
  let isRemoveDrawerOpen = $state(false)

  let removedId = $state<string | null>(null)
  let removedName = $state<string | null>(null)
  function openRemoveDrawer(id: string, name: string) {
    isRemoveDrawerOpen = !isRemoveDrawerOpen
    removedId = id
    removedName = name
  }
  function openCreateDrawer() {
    isCreateDrawerOpen = !isCreateDrawerOpen
  }
</script>

<Sidebar.Provider bind:open>
  <AppSidebar {openRemoveDrawer} {openCreateDrawer} />

  <Sidebar.Inset class="touch-pan-y pb-24">
    <Header />
    {#if !$router}
      <p>router not found</p>
    {:else if $router.route === 'start'}
      <Start />
    {:else if $router.route === 'main'}
      {#await getHandle($router.params.id).whenReady() then _}
        <Main id={$router.params.id} />
      {/await}
    {:else if $router.route === 'special'}
      {#await getHandle($router.params.id).whenReady() then _}
        <Special id={$router.params.id} />
      {/await}
    {:else if $router.route === 'settings'}
      <Settings />
    {/if}

    <PwaBadge />

    {#if removedId && removedName}
      <RemoveDrawer
        bind:isOpen={isRemoveDrawerOpen}
        id={removedId}
        name={removedName}
      />
    {/if}
    <CreateDrawer bind:isOpen={isCreateDrawerOpen} />
    <div
      class="z-1 fixed bottom-0 left-0 h-20 w-full bg-gradient-to-t from-white"
    ></div>
  </Sidebar.Inset>
</Sidebar.Provider>
