<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Input from '$lib/components/ui/input/input.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import { isNamePresent, setSpecialList } from '$src/stores/docs'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import type { SpecialItems, SpecialListData } from '$src/types'
  import { nanoid } from 'nanoid'
  import { stripAutomergePrefix } from '$src/utils'
  import { router } from '$src/stores/router'
  import { openPage } from '@nanostores/router'

  type Props = {
    isOpen: boolean
  }

  let repo = getContextRepo()

  let { isOpen = $bindable(false) } = $props()
  let name = $state('')
  let showMessage = $state(false)

  $effect(() => {
    if (isOpen === false) {
      name = ''
      showMessage = false
    }
  })

  async function createList() {
    if (!name.trim() || isNamePresent(name)) {
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

    const id = stripAutomergePrefix(handle.url)
    setSpecialList({ name, id })

    openPage(router, 'special', { id })
    isOpen = !isOpen
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      createList()
    }
  }
</script>

<Drawer.Root bind:open={isOpen}>
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
          You have to give a name and it shouldn't be used
        </p>
        <Button onclick={createList}>Submit</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
