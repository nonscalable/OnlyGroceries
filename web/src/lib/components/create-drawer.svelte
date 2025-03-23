<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'

  import type { SpecialItems, SpecialListData } from '$src/types'
  import { stripAutomergePrefix } from '$src/utils'
  import { nanoid } from 'nanoid'
  import { openPage } from '@nanostores/router'

  import { router } from '$stores/router'
  import { Autodoc } from '$stores/autodoc.svelte'
  import { createDrawer as drawer } from '$stores/create-drawer.svelte'
  import { g, repo } from '$stores/global.svelte'

  let name = $state('')
  let showMessage = $state(false)

  $effect(() => {
    if (drawer.isOpen) {
      name = ''
      showMessage = false
    }
  })

  function createList() {
    if (!name.trim()) {
      showMessage = true
      return
    }
    let items: SpecialItems = {
      [nanoid()]: {
        text: 'Bratwurst 🌭✨',
        purchased: false
      },
      [nanoid()]: {
        text: 'Glühwein 🍷🎄',
        purchased: false
      },
      [nanoid()]: {
        text: 'Weihnachtsstollen 🍞🎅',
        purchased: false
      },
      [nanoid()]: {
        text: 'Lebkuchen 🍪⭐',
        purchased: false
      }
    }
    let handle = repo.create<SpecialListData>({
      items,
      ids: Object.keys(items)
    })
    let id = stripAutomergePrefix(handle.url)
    g.specialDocs[id] = new Autodoc<SpecialListData>({ handle })
    g.rootDoc?.change(d => {
      d.specialInfos.push({ name, id })
    })

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
