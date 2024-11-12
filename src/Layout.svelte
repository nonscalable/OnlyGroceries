<script lang="ts">
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './Header.svelte'
  import HomePage from './HomePage.svelte'
  import { Repo, type AutomergeUrl } from '@automerge/automerge-repo'
  import { addAutomergePrefix, stripAutomergePrefix } from './utils'
  import { router } from './stores/router'
  import Start from './Start.svelte'

  import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb'
  import { BrowserWebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket'
  import PwaBadge from '$lib/components/PWABadge.svelte'
  import { onMount } from 'svelte'
  import { getAutomergeKey } from './idb'
  import { openPage } from '@nanostores/router'

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter('wss://sync.automerge.org')]
  })

  setContextRepo(repo)

  let key
  onMount(async () => {
    key = await getAutomergeKey()
    if (key) {
      openPage(router, 'main', { id: stripAutomergePrefix(key) })
    }
  })

  function getHandle(id: string) {
    return repo.find(addAutomergePrefix(id) as AutomergeUrl)
  }
</script>

<Header />
{#if !$router}
  <p>router not found</p>
{:else if $router.route === 'start'}
  <Start />
{:else if $router.route === 'main'}
  {#await getHandle($router.params.id).whenReady() then _}
    <HomePage id={$router.params.id} />
  {/await}
{/if}

<PwaBadge />
