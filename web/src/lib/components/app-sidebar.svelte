<script lang="ts">
  import * as Sidebar from './ui/sidebar/index.js'
  import { useSidebar } from './ui/sidebar/index.js'

  import Command from 'lucide-svelte/icons/command'
  import Download from 'lucide-svelte/icons/download'
  import House from 'lucide-svelte/icons/house'
  import ListTodo from 'lucide-svelte/icons/list-todo'
  import Settings from 'lucide-svelte/icons/settings'
  import Trash2 from 'lucide-svelte/icons/trash-2'
  import Upload from 'lucide-svelte/icons/upload'
  import Plus from 'lucide-svelte/icons/plus'
  import Sortable, { type SortableEvent } from 'sortablejs'
  import { nanoid } from 'nanoid'

  import { router } from '$stores/router'
  import { removeDrawer } from '$stores/remove-drawer.svelte'
  import { createDrawer } from '$stores/create-drawer.svelte'
  import { setSpecialListOrder } from '$src/lib/core'
  import { isSpecial, isStaple } from '$src/lib/core/types'

  import { getPagePath, openPage } from '@nanostores/router'
  import { type AutomergeDocumentStore } from '@automerge/automerge-repo-svelte-store'
  import type { Root } from '$src/lib/core/types.js'
  import { toast } from 'svelte-sonner'

  type SavePickerWindow = Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>
        close: () => Promise<void>
      }>
    }>
  }

  type OpenPickerWindow = Window & {
    showOpenFilePicker?: (options?: {
      multiple?: boolean
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
    }) => Promise<Array<{ getFile: () => Promise<File> }>>
  }

  interface Props {
    rootDoc: AutomergeDocumentStore<Root> | null
  }
  const { rootDoc }: Props = $props()

  let sidebar = useSidebar()
  let appVersion = $state(__APP_VERSION__)
  let specialListsMenuEl = $state<HTMLUListElement | null>(null)

  function toggleSidebarIfMobile() {
    if (sidebar.isMobile) {
      sidebar.toggle()
    }
  }
  function onCreate() {
    toggleSidebarIfMobile()
    createDrawer.open()
  }
  function onRemove(id: string, name: string) {
    removeDrawer.specialList = { id, name }
    toggleSidebarIfMobile()
    removeDrawer.open()
  }

  function goMain(event: MouseEvent) {
    event.preventDefault()
    openPage(router, 'main')
    toggleSidebarIfMobile()
  }

  async function saveListsAndItems() {
    try {
      if (!rootDoc) {
        throw new Error('Active list data is not ready yet')
      }

      const rootData = rootDoc.handle.doc()
      if (!rootData) {
        throw new Error('Active list data is not ready yet')
      }

      const staples = rootData.globalOrder
        .filter(id => isStaple(rootData.items[id]))
        .map(id => ({
          text: rootData.items[id].text,
          inCart: rootData.items[id].inCart,
          purchased: rootData.items[id].purchased
        }))

      const specialLists = rootData.specials.order.map(specialId => {
        const name = rootData.specials.lists[specialId]?.name ?? 'Unnamed List'
        const items = rootData.globalOrder
          .filter(id => isSpecial(rootData.items[id], specialId))
          .map(id => ({
            text: rootData.items[id].text,
            inCart: rootData.items[id].inCart,
            purchased: rootData.items[id].purchased
          }))

        return {
          name,
          items
        }
      })

      const payload = {
        staples,
        specialLists
      }

      const fileName = 'onlygroceries-lists-and-items.json'
      const contents = JSON.stringify(payload, null, 2)

      const win = window as SavePickerWindow
      if (typeof win.showSaveFilePicker === 'function') {
        const handle = await win.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'JSON Files',
              accept: {
                'application/json': ['.json']
              }
            }
          ]
        })

        const writable = await handle.createWritable()
        await writable.write(contents)
        await writable.close()
      } else {
        const blob = new Blob([contents], { type: 'application/json' })
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = fileName
        link.click()
        URL.revokeObjectURL(blobUrl)
      }

      toast.success('Lists and items exported successfully')
    } catch (error: unknown) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      toast.error(
        `Save lists and items failed: ${(error as Error)?.message || 'Unknown error'}`
      )
    }
  }

  async function importListsAndItems() {
    try {
      if (!rootDoc) {
        throw new Error('Active list data is not ready yet')
      }

      const contents = await selectImportFileContents()
      if (!contents) {
        return
      }

      const parsed = JSON.parse(contents) as {
        staples?: unknown
        specialLists?: unknown
      }

      if (!Array.isArray(parsed.staples)) {
        throw new Error('Import file is missing a valid staples array')
      }

      if (!Array.isArray(parsed.specialLists)) {
        throw new Error('Import file is missing a valid specialLists array')
      }

      let importedStaplesCount = 0
      let importedSpecialItemsCount = 0
      let importedSpecialListsCount = 0

      rootDoc.change(doc => {
        for (const rawStaple of parsed.staples as Array<Record<string, unknown>>) {
          if (!rawStaple || typeof rawStaple.text !== 'string') continue

          const id = nanoid()
          doc.items[id] = {
            text: rawStaple.text,
            inCart: Boolean(rawStaple.inCart),
            purchased: Boolean(rawStaple.purchased),
            kind: 'staple'
          }
          doc.globalOrder.push(id)
          importedStaplesCount += 1
        }

        for (const rawSpecialList of parsed.specialLists as Array<Record<string, unknown>>) {
          if (!rawSpecialList || typeof rawSpecialList.name !== 'string') continue

          const specialListId = nanoid()
          doc.specials.lists[specialListId] = {
            name: rawSpecialList.name || 'Imported List'
          }
          doc.specials.order.push(specialListId)
          importedSpecialListsCount += 1

          const rawItems = Array.isArray(rawSpecialList.items)
            ? (rawSpecialList.items as Array<Record<string, unknown>>)
            : []

          for (const rawItem of rawItems) {
            if (!rawItem || typeof rawItem.text !== 'string') continue

            const id = nanoid()
            doc.items[id] = {
              text: rawItem.text,
              inCart: Boolean(rawItem.inCart),
              purchased: Boolean(rawItem.purchased),
              kind: 'special',
              specialId: specialListId
            }
            doc.globalOrder.push(id)
            importedSpecialItemsCount += 1
          }
        }
      })

      toast.success('Lists and items imported successfully', {
        description: `${importedStaplesCount} staples, ${importedSpecialListsCount} lists, ${importedSpecialItemsCount} list items`
      })
    } catch (error: unknown) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      toast.error(
        `Import lists and items failed: ${(error as Error)?.message || 'Unknown error'}`
      )
    }
  }

  async function selectImportFileContents(): Promise<string | null> {
    const win = window as OpenPickerWindow
    if (typeof win.showOpenFilePicker === 'function') {
      const [handle] = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json']
            }
          }
        ]
      })

      const file = await handle.getFile()
      return file.text()
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'

      input.onchange = async () => {
        try {
          const file = input.files?.[0]
          if (!file) {
            resolve(null)
            return
          }

          resolve(await file.text())
        } catch (error) {
          reject(error)
        }
      }

      input.click()
    })
  }

  const specialListSortOptions: Sortable.SortableOptions = {
    animation: 150,
    swapThreshold: 0.5,
    draggable: '[data-special-list-id]',
    delay: 80,
    delayOnTouchOnly: true,
    onEnd: handleSpecialListSort
  }

  function handleSpecialListSort(event: SortableEvent) {
    const { oldIndex, newIndex } = event
    if (typeof oldIndex !== 'number' || typeof newIndex !== 'number') return
    if (!specialListsMenuEl) return

    const orderedIds = Array.from(
      specialListsMenuEl.querySelectorAll('[data-special-list-id]')
    )
      .map(node => (node as HTMLElement).dataset.specialListId)
      .filter((id): id is string => Boolean(id))

    rootDoc?.change(doc => {
      setSpecialListOrder(doc, orderedIds)
    })
  }

  $effect(() => {
    if (!specialListsMenuEl) return

    const sortable = Sortable.create(specialListsMenuEl, specialListSortOptions)
    return () => sortable.destroy()
  })
</script>

{#if $rootDoc}
  <Sidebar.Root class="border-r-0" variant="inset">
    <Sidebar.Header class="pt-safe">
      <Sidebar.Menu>
        <!-- Logo -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg">
            {#snippet child({ props })}
              <a href="##" {...props}>
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">OnlyGroceries</span>
                  <span class="truncate text-xs">{appVersion}</span>
                </div>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>

        <!-- Home -->
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" isActive={$router?.route === 'main'}>
            {#snippet child({ props })}
              <a href={getPagePath(router, 'main')} onclick={goMain} {...props}>
                <House />
                <span class="truncate leading-tight">Main</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Header>

    <!-- Special Lists -->
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Special Lists</Sidebar.GroupLabel>
        <Sidebar.GroupAction title="Add List" onclick={onCreate}>
          <Plus />
        </Sidebar.GroupAction>
        <Sidebar.GroupContent>
          <Sidebar.Menu bind:ref={specialListsMenuEl}>
            {#if $rootDoc}
              {@const specialLists = $rootDoc.specials.order}
              {#if specialLists.length > 0}
                {#each specialLists as listId (listId)}
                  {@const listName = $rootDoc.specials.lists[listId].name}
                  <Sidebar.MenuItem data-special-list-id={listId}>
                    <Sidebar.MenuButton
                      size="lg"
                      onclick={toggleSidebarIfMobile}
                      isActive={$router?.route == 'special' &&
                        $router.params.id == listId}
                    >
                      {#snippet child({ props })}
                        <a
                          href={getPagePath(router, 'special', { id: listId })}
                          {...props}
                        >
                          <ListTodo />
                          <span class="truncate leading-tight">{listName}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>

                    <Sidebar.MenuAction
                      title="Remove List"
                      onclick={() => onRemove(String(listId), listName)}
                    >
                      <Trash2 />
                    </Sidebar.MenuAction>
                  </Sidebar.MenuItem>
                {/each}
              {:else}
                <Sidebar.MenuItem
                  class="text-sidebar-foreground/65 text-center text-xs italic leading-10"
                >
                  No special lists yet
                </Sidebar.MenuItem>
              {/if}
            {/if}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer class="mb-5">
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" onclick={saveListsAndItems}>
            <Download />
            <span class="truncate leading-tight">Save Lists and Items</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" onclick={importListsAndItems}>
            <Upload />
            <span class="truncate leading-tight">Import Lists and Items</span>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton size="lg" onclick={toggleSidebarIfMobile}>
            {#snippet child({ props })}
              <a href={getPagePath(router, 'settings')} {...props}>
                <Settings />
                <span class="truncate leading-tight">Settings</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Footer>
  </Sidebar.Root>
{/if}
