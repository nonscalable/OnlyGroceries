<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import TabsList from '$lib/components/ui/tabs/tabs-list.svelte'
  import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte'
  import type { ItemType } from '$src/types'
  import { nanoid } from 'nanoid'
  import { g } from '$src/stores/global.svelte'
  import { toast } from 'svelte-sonner'

  type Props = {
    activeTab: ItemType
  }
  let { activeTab }: Props = $props()
  let text = $state('')

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      toast.error('You have to type something')
      return
    }

    let item = {
      text: text.trim(),
      type: activeTab,
      purchased: false,
      inCart: activeTab === 'rare' ? true : false
    }
    let id = nanoid()

    g.mainDoc?.change(d => {
      d.items[id] = item
      activeTab === 'rare' ? d.rareIds.push(id) : d.regularIds.push(id)
    })
    text = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      add()
    }
  }
</script>

<TabsList class="grid w-full grid-cols-2">
  <TabsTrigger class="h-8" value="regular">Staples</TabsTrigger>
  <TabsTrigger class="h-8" value="rare">Shopping List</TabsTrigger>
</TabsList>
<div class="mb-4 mt-4 flex flex-col gap-1">
  <Input
    class="text-md focus-visible:ring-offset-1"
    bind:value={text}
    onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
    placeholder={`Add ${activeTab === 'regular' ? 'regular' : 'occasional'} item`}
    required
  />

  <Button class="mt-3" onclick={add} size="lg">Add</Button>
</div>
