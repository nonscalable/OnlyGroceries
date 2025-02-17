<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer'
  import Button from '$lib/components/ui/button/button.svelte'
  import { toast } from 'svelte-sonner'
  import { openPage } from '@nanostores/router'
  import type { SpecialListData } from '$src/types'

  import { removeDrawer as drawer } from '$stores/remove-drawer.svelte'
  import { router } from '$stores/router'
  import type { Autodoc } from '$stores/autodoc.svelte'
  import { g } from '$stores/global.svelte'

  function remove() {
    if (drawer.listType === 'main') {
      g.mainDoc?.delete()
      g.mainDoc = undefined
      g.rootDoc?.change(d => (d.mainID = null))
    } else {
      g.specialDocs[drawer.listId!].delete()
      g.specialDocs[drawer.listId!] = {} as Autodoc<SpecialListData>
      g.rootDoc?.change(d => {
        let index = d.specialInfos.findIndex(item => item.id === drawer.listId)
        if (index !== -1) {
          d.specialInfos.splice(index, 1)
        }
      })
    }

    openPage(router, 'home')

    drawer.close()
    toast(`${drawer.listName} has been deleted`, {
      cancel: { label: 'Close' }
    })
  }
</script>

<Drawer.Root bind:open={drawer.isOpen}>
  <Drawer.Content>
    <div class="mx-auto mb-4 w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title class="mb-4">{`Delete ${drawer.listName}`}</Drawer.Title>
        <Drawer.Description>Are you sure?</Drawer.Description>
      </Drawer.Header>

      <div class="flex flex-col gap-3 p-4">
        <Button onclick={drawer.close} variant="secondary">Cancel</Button>
        <Button onclick={remove} variant="destructive">Delete</Button>
      </div>
    </div>
  </Drawer.Content>
</Drawer.Root>
