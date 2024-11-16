<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Input from '$lib/components/ui/input/input.svelte'
  import { isValidAutomergeUrl } from '@automerge/automerge-repo/slim'
  import Button from '$lib/components/ui/button/button.svelte'
  import { openPage } from '@nanostores/router'
  import { router } from '$stores/router'
  import { setMainId } from '$stores/docs'
  import { addAutomergePrefix } from '$src/utils'
  type Props = {
    isOpen: boolean
  }
  let { isOpen = $bindable(false) } = $props()
  let joinID = $state('')
  let showMessage = $state(false)

  $effect(() => {
    if (isOpen === false) {
      joinID = ''
      showMessage = false
    }
  })

  async function join() {
    //TODO: if main has been created show message that it will be replaced by new list
    //TODO: check if its the same automerge url that already exist on this peer
    if (!isValidAutomergeUrl(addAutomergePrefix(joinID))) {
      showMessage = true
      return
    }

    // await storeAutomergeKey(joinUrl)
    setMainId(joinID)

    openPage(router, 'main', { id: joinID })
    isOpen = !isOpen
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      join()
    }
  }
</script>

<Drawer.Root bind:open={isOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4">Join</Drawer.Title>
        <Drawer.Description>Paste the ID from your inviter</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-3 p-4">
        <Input
          type="text"
          class="text-md"
          bind:value={joinID}
          onkeydown={(e: KeyboardEvent) => handleKeydown(e)}
        />
        <p
          class="h-5 text-sm text-red-700 transition-opacity"
          class:opacity-100={showMessage}
          class:opacity-0={!showMessage}
        >
          You have to enter valid ID
        </p>
        <Button onclick={join}>Submit</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
