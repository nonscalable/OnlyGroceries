<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import TabsList from '$lib/components/ui/tabs/tabs-list.svelte'
  import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte'
  import type { ItemKind } from '$src/lib/core/types'
  import { toast } from 'svelte-sonner'

  type Props = {
    activeTab: ItemKind
    addToCart: (text: string) => void
  }
  let { addToCart, activeTab }: Props = $props()
  let text = $state('')

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      toast.error('You have to type something')
      return
    }

    addToCart(text.trim())
    text = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      add()
    }
  }
</script>

<TabsList class="grid w-full grid-cols-2">
  <TabsTrigger class="h-8" value="staple">Staples</TabsTrigger>
  <TabsTrigger class="h-8" value="rare">Shopping List</TabsTrigger>
</TabsList>
<div class="mb-4 mt-4 flex flex-col gap-1">
  <Input
    class="text-md focus-visible:ring-offset-1"
    bind:value={text}
    onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
    placeholder={`Add ${activeTab === 'staple' ? 'regular' : 'occasional'} item`}
    required
  />

  <Button class="mt-3" onclick={add} size="lg">Add</Button>
</div>
