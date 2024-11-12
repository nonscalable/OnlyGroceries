<script lang="ts">
  import { onMount } from 'svelte'
  import { getAutomergeKey, storeAutomergeKey } from './idb'
  import { Button } from '$lib/components/ui/button'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import type { GroceryData } from './types'
  import { router } from './stores/router'
  import { stripAutomergePrefix } from './utils'
  import type { AutomergeUrl } from '@automerge/automerge-repo/slim'
  import { getPagePath, openPage } from '@nanostores/router'

  let docUrl = $state<AutomergeUrl | null>()
  let repo = getContextRepo()

  onMount(async () => {
    docUrl = await getAutomergeKey()
  })

  async function createDoc(event: any) {
    event.preventDefault()

    let handle = repo.create<GroceryData>({
      items: {},
      regularIds: [],
      rareIds: []
    })
    await storeAutomergeKey(handle.url)
    const id = stripAutomergePrefix(handle.url)

    openPage(router, 'main', { id })
  }
</script>

<div class="mx-auto max-w-sm py-4">
  <p>Start</p>
  {#if docUrl}
    <p>You alredy created a list</p>
    <Button
      href={getPagePath(router, 'main', { id: stripAutomergePrefix(docUrl) })}
      variant="link">Link</Button
    >
  {:else}
    <p>Create your first list</p>
    <Button onclick={createDoc}>Create</Button>
  {/if}
</div>
