<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import type { GroceryData, Items } from '../types'
  import { router } from '../stores/router'
  import { stripAutomergePrefix } from '../utils'
  import { getPagePath, openPage } from '@nanostores/router'
  import { mainId, setMainId } from '../stores/docs'
  import { nanoid } from 'nanoid'

  let repo = getContextRepo()
  let items: Items = {
    [nanoid()]: {
      text: 'Milk 🥛',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Bread 🍞',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Salad 🥬',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Tomatoes 🍅',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Avocado 🥑',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Eggs 🥚',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Cheese 🧀',
      type: 'regular',
      purchased: false,
      inCart: false
    },
    [nanoid()]: {
      text: 'Chocolate 🍫',
      type: 'regular',
      purchased: false,
      inCart: false
    }
  }
  async function createDoc() {
    let handle = repo.create<GroceryData>({
      items,
      regularIds: Object.keys(items),
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
