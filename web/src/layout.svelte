<script lang="ts">
  import Header from '$lib/components/header/header.svelte'
  import CreateDrawer from '$lib/components/create-drawer.svelte'
  import RemoveDrawer from '$lib/components/remove-drawer.svelte'
  import PwaBadge from '$lib/components/pwa-badge.svelte'
  import * as Sidebar from '$lib/components/ui/sidebar/index.js'
  import AppSidebar from '$lib/components/app-sidebar.svelte'

  import Main from './pages/main.svelte'
  import Settings from './pages/settings.svelte'
  import Special from './pages/special.svelte'

  import { router } from '$stores/router'

  import { getRoot, repo, persistedRootUrl } from '$src/lib/core/repo'
  import {
    document,
    type AutomergeDocumentStore
  } from '@automerge/automerge-repo-svelte-store'
  import { type Root } from '$src/lib/core/types'
  import type { AutomergeUrl } from '@automerge/automerge-repo'
  import { nanoid } from 'nanoid'
  import { createSpecialList, deleteSpecialList } from '$src/lib/core'

  let rootUrl = $state(getRoot())
  let root = $state<AutomergeDocumentStore<Root> | null>(null)

  $effect(() => {
    document<Root>(rootUrl, repo)
      .then(store => {
        root = store
      })
      .catch((err: unknown) => {
        console.error('Load Root Document:', err)
      })
  })

  $effect.root(() => {
    if (root) {
      root.subscribe(() => {})
    }
  })

  function onRemove(id: string) {
    root?.change(doc => {
      deleteSpecialList(doc, id)
    })
  }

  function onCreate(name: string): string {
    if (!root) {
      throw Error('unreachable')
    }

    const id = nanoid()
    root.change(doc => {
      createSpecialList(doc, id, name)
    })
    return id
  }

  async function setRootId(newRootUrl: AutomergeUrl): Promise<null | string> {
    try {
      await repo.find(newRootUrl, {
        // it is needed to make repo throw when the rootID not found.
        // This way, if we can not load the new document, we'll fall into
        // the catch statement and won't delete the current data
        allowableStates: ['ready']
      })

      rootUrl = newRootUrl
      persistedRootUrl.set(newRootUrl)

      return null
    } catch (err: unknown) {
      return `Error: ${(err as Error).message || 'Something went wrong'}`
    }
  }
  $inspect($router)
</script>

<Sidebar.Provider class="pt-safe">
  <AppSidebar rootDoc={root} />

  <Sidebar.Inset class="touch-pan-y pb-24">
    <Header />

    {#if $root}
      {#if !$router}
        <Main {root} />
      {:else if $router.route === 'special'}
        <Special {root} listId={$router.params.id} />
      {:else if $router.route === 'settings'}
        <Settings {setRootId} />
      {:else}
        <Main {root} />
      {/if}

      <PwaBadge />

      <RemoveDrawer {onRemove} />
      <CreateDrawer {onCreate} />
      <div
        class="z-1 fixed bottom-0 left-0 h-20 w-full bg-gradient-to-t from-white"
      ></div>
    {/if}
  </Sidebar.Inset>
</Sidebar.Provider>
