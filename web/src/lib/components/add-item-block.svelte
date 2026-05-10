<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import TabsList from '$lib/components/ui/tabs/tabs-list.svelte'
  import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte'
  import type { ItemKind } from '$src/lib/core/types'
  import { toast } from 'svelte-sonner'

  type AddItemSuggestion = {
    id: string
    text: string
    sourceName: string
  }

  type Props = {
    activeTab: ItemKind
    addToCart: (text: string, sourceItemId?: string) => void
    suggestionSource: AddItemSuggestion[]
  }
  let { addToCart, activeTab, suggestionSource }: Props = $props()
  let text = $state('')

  let matchedSuggestions = $derived.by<AddItemSuggestion[]>(() => {
    if (activeTab !== 'rare') return []

    const query = text.trim().toLowerCase()
    if (!query) return []

    return suggestionSource
      .filter(item => item.text.toLowerCase().includes(query))
      .slice(0, 8)
  })

  function add() {
    let formatted = text.toLowerCase().trim()
    if (!formatted) {
      toast.error('You have to type something')
      return
    }

    const selectedMatch =
      activeTab === 'rare'
        ? matchedSuggestions.find(
            item => item.text.trim().toLowerCase() === formatted
          )
        : undefined

    addToCart(text.trim(), selectedMatch?.id)
    text = ''
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      add()
    }
  }

  function pickSuggestion(suggestion: AddItemSuggestion) {
    addToCart(suggestion.text, suggestion.id)
    text = ''
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

  {#if activeTab === 'rare' && matchedSuggestions.length > 0}
    <div class="relative left-1/2 mt-2 w-screen -translate-x-1/2 px-2 sm:left-auto sm:w-full sm:translate-x-0 sm:px-0">
      <div class="max-h-64 overflow-y-auto rounded-md border bg-background shadow-sm">
        {#each matchedSuggestions as suggestion (suggestion.id)}
          <button
            type="button"
            class="flex min-h-12 w-full items-center justify-between gap-2 border-b px-4 py-3 text-left last:border-b-0 active:bg-slate-100"
            onclick={() => pickSuggestion(suggestion)}
          >
            <span class="truncate font-medium">{suggestion.text}</span>
            <span class="shrink-0 text-xs text-slate-500">{suggestion.sourceName}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <Button class="mt-3" onclick={add} size="lg">Add</Button>
</div>
