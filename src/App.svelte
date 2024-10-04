<script lang="ts">
  import './app.css'
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import * as Tabs from '$lib/components/ui/tabs'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Toggle } from '$lib/components/ui/toggle'

  type Item = {
    text: string
    inCart: boolean
    purchased: boolean
    type: ItemType
  }

  type ItemType = 'regular' | 'rare'

  let items = $state<Item[]>([])
  let text = $state('')
  let activeTab = $state('regular')

  function add(type: ItemType) {
    if (itemTexts.includes(text)) {
      text = ''
      return
    }

    let item = {
      text,
      type,
      purchased: false,
      inCart: type === 'rare' ? true : false
    }

    items = [...items, item]
    text = ''
  }
  function toggleInCart(item: Item) {
    item.inCart = !item.inCart
    item.purchased = false
  }
  function togglePurchased(item: Item) {
    item.purchased = !item.purchased
  }
  let regularItems = $derived(items.filter(item => item.type === 'regular'))
  let cartItems = $derived(items.filter(item => item.inCart))
  let itemTexts = $derived(items.map(item => item.text))
</script>

<header class="border-b p-2">
  <h1 class="text-4xl font-extrabold tracking-tight">Hello!</h1>
</header>
<main class="container pt-2 sm:w-[350px]">
  <Tabs.Root bind:value={activeTab}>
    <Tabs.List class="grid w-full grid-cols-2">
      <Tabs.Trigger value="regular">Regular Items</Tabs.Trigger>
      <Tabs.Trigger value="cart">Shopping Cart</Tabs.Trigger>
    </Tabs.List>
    <div class="mb-4 mt-4 flex flex-col gap-2">
      <Input
        bind:value={text}
        placeholder={`Add ${activeTab === 'regular' ? 'regular' : 'rare'} item`}
      />
      <Button
        disabled={!text.trim()}
        on:click={() => add(activeTab === 'regular' ? 'regular' : 'rare')}
        >Add</Button
      >
    </div>
    <Tabs.Content value="regular">
      <ul>
        {#each regularItems as item (item.text)}
          <li>
            <Toggle
              variant="outline"
              class="mb-2 flex w-full items-center justify-between"
              bind:pressed={item.inCart}
              on:click={() => toggleInCart(item)}
            >
              <div class="flex items-center gap-2">
                <span>{item.text}</span>
              </div>

              <span class=" text-sm text-gray-500">
                {item.inCart ? 'In Cart' : ''}
              </span>
            </Toggle>
          </li>
        {/each}
      </ul>
    </Tabs.Content>
    <Tabs.Content value="cart">
      {#each cartItems as item (item.text)}
        <li class="mb-2 flex items-center gap-2">
          <Checkbox
            checked={item.purchased}
            onCheckedChange={() => togglePurchased(item)}
          />
          <span class={item.purchased ? 'line-through' : ''}>{item.text}</span>
        </li>
      {/each}
    </Tabs.Content>
  </Tabs.Root>
</main>
