<script lang="ts">
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './lib/components/header/header.svelte'
  import Main from './pages/main.svelte'
  import { Repo, type AutomergeUrl } from '@automerge/automerge-repo'
  import { addAutomergePrefix, stripAutomergePrefix } from './utils'
  import { router } from './stores/router'
  import Start from './pages/start.svelte'

  import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
  import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
  import PwaBadge from '$lib/components/pwa-badge.svelte'
  import { openPage } from '@nanostores/router'
  import { mainId } from './stores/docs'
  import Settings from './pages/settings.svelte'
  //TODO: make 'delete document' feature. Clear automerge idb, store
  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter('wss://sync.automerge.org')]
  })

  setContextRepo(repo)

  if ($mainId) {
    openPage(router, 'main', { id: $mainId })
  }

  function getHandle(id: string) {
    return repo.find(addAutomergePrefix(id) as AutomergeUrl)
  }
</script>

<!-- TODO: figure out if its ok to call repo.find and .whenReady everytime -->
<Header mainId={$mainId} />
{#if !$router}
  <p>router not found</p>
{:else if $router.route === 'start'}
  <Start />
{:else if $router.route === 'main'}
  {#await getHandle($router.params.id).whenReady() then _}
    <Main id={$router.params.id} />
  {/await}
{:else if $router.route === 'settings'}
  <Settings />
{/if}

<PwaBadge />
