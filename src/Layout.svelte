<script lang="ts">
  import { setContext } from 'svelte'
  import { setContextRepo } from '@automerge/automerge-repo-svelte-store'
  import Header from './Header.svelte'
  import HomePage from './HomePage.svelte'
  import type { AutomergeUrl, Repo } from '@automerge/automerge-repo'
  import { stripAutomergePrefix } from './utils'

  interface Props {
    docUrl: AutomergeUrl
    repo: Repo
  }
  let { docUrl, repo }: Props = $props()

  const docHash = stripAutomergePrefix(docUrl)

  setContextRepo(repo)
  setContext('docUrl', docUrl)

  document.location.hash = docHash
</script>

<Header />
<main>
  <HomePage id={docHash} />
</main>
