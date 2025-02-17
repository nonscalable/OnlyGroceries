<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import type { Items } from '../types'
  import { stripAutomergePrefix } from '../utils'
  import { getPagePath, openPage } from '@nanostores/router'
  import { nanoid } from 'nanoid'

  import { router } from '$stores/router'
  import { Autodoc } from '$stores/autodoc.svelte'
  import { g } from '$stores/global.svelte'

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
    g.mainDoc = new Autodoc({
      initial: {
        items,
        regularIds: Object.keys(items),
        rareIds: []
      }
    })
    const id = stripAutomergePrefix(g.mainDoc.handle.url)
    g.rootDoc?.change(d => {
      d.mainID = id
    })

    openPage(router, 'main', { id })
  }
</script>

<div class="container pt-2">
  <h2 class="text-3xl font-bold">Home</h2>
  <div class="mt-5 flex">
    {#if g.rootDoc?.state?.mainID}
      <Button
        href={getPagePath(router, 'main', {
          id: stripAutomergePrefix(g.rootDoc?.state?.mainID)
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
