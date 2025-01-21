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

<div class="container pt-2 sm:w-[350px]">
  <h2 class="text-3xl font-semibold tracking-tight">Start</h2>
  <div class="mt-5 flex">
    {#if $mainId}
      <Button
        href={getPagePath(router, 'main', {
          id: stripAutomergePrefix($mainId)
        })}
        variant="outline">Go to your main list</Button
      >
    {:else}
      <Button onclick={createDoc} variant="outline"
        >Create your main list</Button
      >
    {/if}
  </div>
</div>
