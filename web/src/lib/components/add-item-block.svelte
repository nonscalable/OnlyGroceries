<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import TabsList from '$lib/components/ui/tabs/tabs-list.svelte'
  import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte'
  import type { ItemType } from '$src/types'
  import { nanoid } from 'nanoid'
  import { g } from '$src/stores/global.svelte'

  type Props = {
    activeTab: ItemType
  }
  let { activeTab }: Props = $props()

  let text = $state('')
  let message = $state('')
  let showMessage = $state(false)

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      message = 'You have to type something'
      showMessage = true
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
  <TabsTrigger value="regular">Staples</TabsTrigger>
  <TabsTrigger value="rare">Shopping List</TabsTrigger>
</TabsList>
<div class="mb-4 mt-4 flex flex-col gap-1">
  <Input
    class="text-md focus-visible:ring-offset-1"
    bind:value={text}
    onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
    oninput={() => (showMessage = false)}
    placeholder={`Add ${activeTab === 'regular' ? 'regular' : 'occasional'} item`}
    required
  />
  <p
    class="h-5 text-sm text-red-700 transition-opacity"
    class:opacity-100={showMessage}
    class:opacity-0={!showMessage}
  >
    {message}
  </p>
  <Button onclick={add} size="lg">Add</Button>
</div>
