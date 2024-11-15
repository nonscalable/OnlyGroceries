<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import type { GroceryData } from './types'
  import { router } from './stores/router'
  import { stripAutomergePrefix } from './utils'
  import { getPagePath, openPage } from '@nanostores/router'
  import { mainId, setMainId } from './stores/docs'

  let repo = getContextRepo()

  async function createDoc() {
    let handle = repo.create<GroceryData>({
      items: {},
      regularIds: [],
      rareIds: []
    })

    const id = stripAutomergePrefix(handle.url)
    setMainId(id)

    openPage(router, 'main', { id })
  }
</script>

<div class="mx-auto max-w-sm py-4">
  <p>Start</p>
  {#if $mainId}
    <p>You alredy created a list</p>
    <Button
      href={getPagePath(router, 'main', { id: stripAutomergePrefix($mainId) })}
      variant="link">Link</Button
    >
  {:else}
    <p>Create your first list</p>
    <Button onclick={createDoc}>Create</Button>
  {/if}
</div>
