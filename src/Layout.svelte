<script lang="ts">
  import { router } from './stores/router'
  import { setContext } from 'svelte'
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './Header.svelte'
  import HomePage from './HomePage.svelte'
  import EventsPage from './EventsPage.svelte'
  import type { AutomergeUrl, Repo } from '@automerge/automerge-repo'
  import { openPage } from '@nanostores/router'
  import { stripAutomergePrefix } from './utils'

  interface Props {
    docUrl: AutomergeUrl
    repo: Repo
  }
  let { docUrl, repo }: Props = $props()

  const docHash = stripAutomergePrefix(docUrl)

  setContextRepo(repo)
  setContext('docUrl', docUrl)
  router.open(`/home#${docHash}`)
</script>

<Header />

<main>
  {#if !$router}
    <p>Not found</p>
  {:else if $router.route === 'start'}
    <p>Start</p>
  {:else if $router.route === 'home'}
    <HomePage id={docHash} />
  {:else if $router.route === 'occasional'}
    <EventsPage />
  {/if}
</main>
