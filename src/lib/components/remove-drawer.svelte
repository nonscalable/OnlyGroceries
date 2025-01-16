<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Button from '$lib/components/ui/button/button.svelte'
  import { getContextRepo } from '@automerge/automerge-repo-svelte-store'
  import type { AutomergeUrl } from '@automerge/automerge-repo/slim'
  import { mainId, removeSpecialList } from '$stores/docs'
  import { toast } from 'svelte-sonner'
  import { addAutomergePrefix } from '$src/utils'
  import { openPage } from '@nanostores/router'
  import { router } from '$src/stores/router'

  type Props = {
    isOpen: boolean
    id: string
    name: string
  }
  let { isOpen = $bindable(), id, name }: Props = $props()

  let repo = getContextRepo()

  function remove() {
    repo.delete(addAutomergePrefix(id) as AutomergeUrl)
    removeSpecialList(id)

    $mainId
      ? openPage(router, 'main', { id: $mainId })
      : openPage(router, 'start')

    isOpen = !isOpen
    toast(`Special list ${name} has been deleted`, {
      cancel: { label: 'Close' }
    })
  }
</script>

<Drawer.Root bind:open={isOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4">{`Delete ${name}`}</Drawer.Title>
        <Drawer.Description>Are you sure?</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-3 p-4">
        <Button onclick={() => (isOpen = !isOpen)} variant="secondary"
          >Cancel</Button
        >
        <Button onclick={remove} variant="destructive">Delete</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
