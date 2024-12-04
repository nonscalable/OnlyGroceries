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
  import FolderOpen from 'lucide-svelte/icons/folder-open'

  type Props = {
    mainId: string | undefined
  }
  let { mainId }: Props = $props()
  let isSheetOpen = $state(false)

  function goTo(name: RouteName, params = {}) {
    openPage(router, name, params)
    isSheetOpen = false
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
    <nav class="grid items-start gap-2">
      <Button
        onclick={() => goTo('start')}
        variant="ghost"
        class="flex items-center justify-start"
        ><House class="size-4" />Home</Button
      >

      {#if mainId}
        <Button
          onclick={() => goTo('main', { id: mainId })}
          variant="ghost"
          class="flex items-center justify-start"
          ><ListTodo class="size-4" />Main List</Button
        >
      {/if}

      <Button
        onclick={() => goTo('settings')}
        variant="ghost"
        class="flex items-center justify-start"
        ><Settings class="size-4" />Settings</Button
      >

      <Button variant="ghost" disabled class="flex items-center justify-start"
        ><FolderOpen class="size-4" />Special (WIP)</Button
      >
    </nav>
  </Sheet.Content>
</Sheet.Root>
