<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Button from '$lib/components/ui/button/button.svelte'
  import { toast } from 'svelte-sonner'
  import { openPage } from '@nanostores/router'
  import { removeDrawer as drawer } from '$stores/remove-drawer.svelte'
  import { router } from '$stores/router'

  interface Props {
    onRemove: (id: string) => void
  }
  const { onRemove }: Props = $props()

  function remove() {
    if (!drawer.specialList) {
      return
    }

    onRemove(drawer.specialList.id)

    openPage(router, 'main')

    drawer.close()
    toast(`${drawer.specialList.name} has been deleted`, {
      cancel: { label: 'Close' }
    })
  }
</script>

<Drawer.Root bind:open={drawer.isOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4"
          >{`Delete ${drawer.specialList?.name}`}</Drawer.Title
        >
        <Drawer.Description>Are you sure?</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-3 p-4">
        <Button onclick={drawer.close} variant="secondary">Cancel</Button>
        <Button onclick={remove} variant="destructive">Delete</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
