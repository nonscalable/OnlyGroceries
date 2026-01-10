<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'

  import { openPage } from '@nanostores/router'

  import { router } from '$stores/router'
  import { createDrawer as drawer } from '$stores/create-drawer.svelte'

  interface Props {
    onCreate: (name: string) => string
  }
  const { onCreate }: Props = $props()

  let name = $state('')
  let showMessage = $state(false)

  $effect(() => {
    if (drawer.isOpen) {
      name = ''
      showMessage = false
    }
  })

  async function createList() {
    const id = onCreate(name)
    openPage(router, 'special', { id })
    drawer.close()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      createList()
    }
  }
</script>

<Drawer.Root bind:open={drawer.isOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4">Create New List</Drawer.Title>
        <Drawer.Description>Enter its name</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-3 p-4">
        <Input
          type="text"
          class="text-md"
          bind:value={name}
          onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
        />
        <p
          class="h-5 text-sm text-red-700 transition-opacity"
          class:opacity-100={showMessage}
          class:opacity-0={!showMessage}
        >
          You have to give a name
        </p>
        <Button onclick={createList}>Submit</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
