<script lang="ts">
  import Header from '$lib/components/header/header.svelte'
  import CreateDrawer from '$lib/components/create-drawer.svelte'
  import RemoveDrawer from '$lib/components/remove-drawer.svelte'
  import PwaBadge from '$lib/components/pwa-badge.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import AppSidebar from '$lib/components/app-sidebar.svelte'

  import Main from './pages/main.svelte'
  import Home from './pages/home.svelte'
  import Settings from './pages/settings.svelte'
  import Special from './pages/special.svelte'

  import { router } from '$stores/router'
  import { g } from '$stores/global.svelte'

  import { openPage } from '@nanostores/router'

  let mainID = $derived(g.rootDoc?.state?.mainID)

  //TODO: fix this type thing - "g.rootDoc?.state?.mainID"
  $effect(() => {
    if (mainID) {
      openPage(router, 'main', { id: mainID })
    }
  })
</script>

<Sidebar.Provider>
  <AppSidebar />

  <Sidebar.Inset class="touch-pan-y pb-24">
    <Header />
    {#if !$router}
      <p>router not found</p>
    {:else if $router.route === 'home'}
      <Home />
    {:else if $router.route === 'main'}
      <Main />
    {:else if $router.route === 'special'}
      <Special id={$router.params.id} />
    {:else if $router.route === 'settings'}
      <Settings />
    {/if}

    <PwaBadge />

    <RemoveDrawer />
    <CreateDrawer />
    <div
      class="z-1 fixed bottom-0 left-0 h-20 w-full bg-gradient-to-t from-white"
    ></div>
  </Sidebar.Inset>
</Sidebar.Provider>
