<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Input } from '$lib/components/ui/input'
  import type { AutomergeUrl } from '@automerge/automerge-repo/slim'
  import { document } from '@automerge/automerge-repo-svelte-store'
  import { getContext } from 'svelte'
  import type { ItemsList } from './types'

  interface Props {
    id?: string
  }
  let { id }: Props = $props()

  const docUrl: AutomergeUrl = getContext('docUrl')
  let doc = document<ItemsList>(docUrl)
</script>

<div class="container pt-2 sm:w-[350px]">
  <div class="mb-4 mt-4 flex flex-col gap-2">
    <!-- bind:value={text}
    onkeydown={e => handleKeydown(e, add)} -->
    <Input autofocus class="text-md" placeholder={`Add item`} />
    <!-- onclick={add} -->
    <Button>Add</Button>
  </div>

  {#each $doc.items as item, index}
    <li class="mb-2 flex items-center gap-2">
      <!-- onCheckedChange={() => togglePurchased(item.i)} -->
      <Checkbox checked={item.purchased} />
      <span class={item.purchased ? 'line-through' : ''}>{item.text}</span>
    </li>
  {/each}
</div>
