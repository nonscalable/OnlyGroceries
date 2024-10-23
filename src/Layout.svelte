<script lang="ts">
  import { router } from './stores/router'
  import { setContext } from 'svelte'
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './Header.svelte'
  import HomePage from './HomePage.svelte'
  import EventsPage from './EventsPage.svelte'
  import type { AutomergeUrl, Repo } from '@automerge/automerge-repo'

  interface Props {
    docUrl: AutomergeUrl
    repo: Repo
  }
  let { docUrl, repo }: Props = $props()

  setContextRepo(repo)
  setContext('docUrl', docUrl)
</script>

<Header />

<main>
  {#if !$router}
    <p>Not found</p>
  {:else if $router.route === 'home'}
    <HomePage />
  {:else if $router.route === 'occasional'}
    <EventsPage id={$router.params.id} />
  {/if}
</main>
