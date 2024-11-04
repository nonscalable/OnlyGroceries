<script lang="ts">
  import { setContext } from 'svelte'
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './Header.svelte'
  import HomePage from './HomePage.svelte'
  import type { AutomergeUrl, DocHandle, Repo } from '@automerge/automerge-repo'
  import { stripAutomergePrefix } from './utils'

  interface Props {
    docUrl: AutomergeUrl
    repo: Repo
    handle: DocHandle<unknown>
  }
  let { docUrl, repo, handle }: Props = $props()

  const docHash = stripAutomergePrefix(docUrl)

  setContextRepo(repo)
  setContext('docUrl', docUrl)

  document.location.hash = docHash
</script>

<Header />
{#await handle.whenReady()}
  <div>Loading...</div>
{:then _}
  <HomePage id={docHash} />
{/await}
