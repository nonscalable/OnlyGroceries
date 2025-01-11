<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet'
  import Button, {
    buttonVariants
  } from '$lib/components/ui/button/button.svelte'
  import SquareMenu from 'lucide-svelte/icons/square-menu'
  import { openPage } from '@nanostores/router'
  import { router, type RouteName } from '$stores/router'
  import House from 'lucide-svelte/icons/house'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import Plus from 'lucide-svelte/icons/plus'
  import { mainId, specialLists } from '$stores/docs'
  import HeaderSheetDrawer from './header-sheet-drawer.svelte'

  let isSheetOpen = $state(false)
  let isDrawerOpen = $state(false)

  function goTo(name: RouteName, params = {}) {
    openPage(router, name, params)
    isSheetOpen = false
  }

  function createSpecialList() {
    isDrawerOpen = !isDrawerOpen
    isSheetOpen = !isSheetOpen
  }
</script>

<Sheet.Root bind:open={isSheetOpen}>
  <Sheet.Trigger
    class="justify-self-start {buttonVariants({
      variant: 'ghost',
      size: 'icon'
    })} [&_svg]:size-5"
  >
    <SquareMenu />
  </Sheet.Trigger>
  <Sheet.Content side="left" class="flex flex-col justify-center">
    <nav class="grid items-start gap-1">
      <Button
        onclick={() => goTo('start')}
        variant="ghost"
        class="flex items-center justify-start"
        ><House class="size-4" />Home</Button
      >

      {#if $mainId}
        <Button
          onclick={() => goTo('main', { id: $mainId })}
          variant="ghost"
          class="flex items-center justify-start"
          ><ListTodo class="size-4" />Main List</Button
        >
      {/if}

      <div class="mt-4 flex items-center justify-between">
        <h2 class="px-4 font-semibold tracking-tight">Special Lists</h2>
        <Button
          size="icon"
          class="size-8"
          variant="secondary"
          onclick={createSpecialList}><Plus /></Button
        >
      </div>

      {#if $specialLists}
        <div class="ml-4">
          {#each $specialLists as list, i}
            <Button
              onclick={() => goTo('special', { id: list.id })}
              variant="ghost"
              class="flex items-center justify-start"
              ><ListTodo class="size-4" />{list.name}</Button
            >
          {/each}
        </div>
      {/if}

      <Button
        onclick={() => goTo('settings')}
        variant="ghost"
        class="mt-4 flex items-center justify-start"
        ><Settings class="size-4" />Settings</Button
      >
    </nav>
  </Sheet.Content>
</Sheet.Root>

<HeaderSheetDrawer bind:isOpen={isDrawerOpen} />
