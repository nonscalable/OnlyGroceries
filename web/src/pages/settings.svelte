<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import { Label } from '$lib/components/ui/label'
  import { Share, Undo2, Check, Trash2, Download, Upload } from 'lucide-svelte'

  import { toast } from 'svelte-sonner'
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  import {
    createRootDoc,
    persistedRootUrl,
    syncServerUrl,
    addRootDocLink,
    getRootDocLinks,
    removeRootDocLink,
    replaceRootDocLinks,
    upsertRootDocLink,
    ensureDefaultRootDocLink,
    type RootDocLink
  } from '$src/lib/core/repo'
  import {
    highlightColor,
    themePreference,
    type ThemePreference
  } from '$src/stores/theme'
  import { tick } from 'svelte'
  import type { AutomergeUrl } from '@automerge/automerge-repo'
  import { addAutomergePrefix } from '$src/utils'

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

  const { needRefresh, updateServiceWorker } = useRegisterSW({})

  interface Props {
    setRootId: (newId: AutomergeUrl) => Promise<null | string>
  }
  const { setRootId }: Props = $props()

  let version = $state(__APP_VERSION__)
  let buildTime = $state(__BUILD_TIME__)
  let theme = $state<ThemePreference>($themePreference)
  let highlight = $state($highlightColor)
  let url = $state($syncServerUrl)
  let rootName = $state('default')
  let newRootId = $state($persistedRootUrl)
  let savedRootLinks = $state<RootDocLink[]>([])
  let confirmingDeleteKey = $state<string | null>(null)
  let deleteResetTimer: ReturnType<typeof setTimeout> | null = null
  let isShareDisabled = $derived(!newRootId)
  let isUpdateDisabled = $derived(!newRootId || newRootId === $persistedRootUrl)

  $effect(() => {
    const links = ensureDefaultRootDocLink($persistedRootUrl)
    savedRootLinks = links

    const activeLink = links.find(link => link.url === $persistedRootUrl)
    if (activeLink) {
      rootName = activeLink.name
    }
  })

  function saveAppearance() {
    $themePreference = theme
    $highlightColor = highlight
    toast.success('Appearance preferences have been saved')
  }

  async function checkForUpdates() {
    if ($needRefresh) {
      toast('New update available!', {
        position: 'bottom-center',
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: 'Update Now',
          onClick: () => {
            updateServiceWorker()
          }
        },
        cancel: {
          label: 'Later'
        }
      })
    } else {
      toast('App is up to date.', {
        position: 'bottom-center',
        cancel: {
          label: 'OK'
        }
      })
    }
  }

  function save() {
    $syncServerUrl = url
    toast.success('The new sync server URL has been saved', {
      description: `Use the same one on another peer`
    })
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({
        text: $persistedRootUrl
      })
    } else {
      await navigator.clipboard.writeText($persistedRootUrl)
      toast.success('List ID has been copied to clipboard', {
        description: 'Send it to your friend'
      })
    }
  }

  function createNewList() {
    newRootId = createRootDoc()
    toast.success('Created a new list ID', {
      description: 'Save or activate it to start using the new Automerge list'
    })
  }

  async function updateRootDoc() {
    let loadingToast = toast.loading('Wait...', { position: 'bottom-center' })

    // Uncomment the line below to test the toast
    // await new Promise(resolve => setTimeout(resolve, 2000))

    const normalizedRootId = normalizeAutomergeUrl(newRootId)
    if (!normalizedRootId) {
      toast.error('Please enter a valid Automerge list ID or URL', {
        id: loadingToast
      })
      return
    }

    const error = await setRootId(normalizedRootId)
    if (error != null) {
      toast.error(error, { id: loadingToast })
    } else {
      upsertRootDocLink(rootName, normalizedRootId)
      savedRootLinks = ensureDefaultRootDocLink(normalizedRootId)
      newRootId = normalizedRootId
      toast.success('Root document has been changed', { id: loadingToast })
    }

    await tick()
  }

  function normalizeAutomergeUrl(value: string): AutomergeUrl | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('automerge:')) return trimmed as AutomergeUrl
    return addAutomergePrefix(trimmed)
  }

  async function saveRootLink() {
    const normalizedRootId = normalizeAutomergeUrl(newRootId)
    if (!normalizedRootId) {
      toast.error('Please enter a valid Automerge list ID or URL')
      return
    }

    const trimmedName = rootName.trim() || 'Unnamed list'
    addRootDocLink(trimmedName, normalizedRootId)
    savedRootLinks = getRootDocLinks()
    newRootId = normalizedRootId
    toast.success('Saved list link', {
      description: `"${trimmedName}" is available in collaboration links`
    })

    await tick()
    window.location.reload()
  }

  async function activateRootLink(link: RootDocLink) {
    const loadingToast = toast.loading('Switching list...', {
      position: 'bottom-center'
    })

    const error = await setRootId(link.url)
    if (error != null) {
      toast.error(error, { id: loadingToast })
      return
    }

    rootName = link.name
    newRootId = link.url
    savedRootLinks = ensureDefaultRootDocLink(link.url)
    toast.success(`Now using "${link.name}"`, { id: loadingToast })

    await tick()
    window.location.reload()
  }

  function getSavedListKey(link: RootDocLink, index: number): string {
    return `${link.url}:${link.name}:${index}`
  }

  function isDefaultLink(link: RootDocLink): boolean {
    return link.name.trim().toLowerCase() === 'default'
  }

  async function handleDeleteSavedLink(link: RootDocLink, index: number) {
    if (isDefaultLink(link)) {
      return
    }

    const key = getSavedListKey(link, index)
    if (confirmingDeleteKey === key) {
      confirmingDeleteKey = null
      if (deleteResetTimer) clearTimeout(deleteResetTimer)

      const deletingActiveLink = link.url === $persistedRootUrl
      if (deletingActiveLink) {
        const defaultLink = getRootDocLinks().find(savedLink => isDefaultLink(savedLink))
        if (!defaultLink) {
          toast.error('Default list link is missing and cannot be activated')
          return
        }

        const switchError = await setRootId(defaultLink.url)
        if (switchError != null) {
          toast.error(switchError)
          return
        }

        rootName = defaultLink.name
        newRootId = defaultLink.url
      }

      savedRootLinks = removeRootDocLink(link.name, link.url)
      savedRootLinks = getRootDocLinks()
      toast.success(`Removed "${link.name}" from saved lists`)

      await tick()
      window.location.reload()
      return
    }

    confirmingDeleteKey = key
    if (deleteResetTimer) clearTimeout(deleteResetTimer)
    deleteResetTimer = setTimeout(() => {
      confirmingDeleteKey = null
    }, 3000)
  }

  async function exportListMap() {
    const payload = {
      syncServerUrl: $syncServerUrl,
      listMap: getRootDocLinks()
    }

    const fileName = 'onlygrocieries-list-map.json'
    const contents = JSON.stringify(payload, null, 2)

    try {
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

      toast.success('List map exported successfully')
    } catch (error: unknown) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      toast.error(`List map export failed: ${(error as Error)?.message || 'Unknown error'}`)
    }
  }

  async function importListMap() {
    try {
      const contents = await selectImportFileContents()
      if (!contents) {
        return
      }

      const parsed = JSON.parse(contents) as {
        syncServerUrl?: unknown
        listMap?: unknown
        savedLists?: unknown
      }

      if (typeof parsed.syncServerUrl !== 'string') {
        throw new Error('Backup is missing a valid syncServerUrl')
      }

      const importedRawLinks = Array.isArray(parsed.listMap)
        ? parsed.listMap
        : parsed.savedLists

      if (!Array.isArray(importedRawLinks)) {
        throw new Error('Backup is missing a valid list map array')
      }

      const importedLinks = importedRawLinks.filter(
        (link): link is RootDocLink =>
          Boolean(link) &&
          typeof link === 'object' &&
          typeof link.name === 'string' &&
          typeof link.url === 'string' &&
          link.url.startsWith('automerge:')
      )

      url = parsed.syncServerUrl
      $syncServerUrl = parsed.syncServerUrl
      savedRootLinks = replaceRootDocLinks(importedLinks)
      savedRootLinks = ensureDefaultRootDocLink($persistedRootUrl)

      const activeLink = savedRootLinks.find(link => link.url === $persistedRootUrl)
      if (activeLink) {
        rootName = activeLink.name
        newRootId = activeLink.url
      }

      toast.success('List map imported successfully')
    } catch (error: unknown) {
      if ((error as DOMException)?.name === 'AbortError') {
        return
      }

      toast.error(`List map import failed: ${(error as Error)?.message || 'Unknown error'}`)
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

  $effect(() => {
    return () => {
      if (deleteResetTimer) clearTimeout(deleteResetTimer)
    }
  })
</script>

<main class="container pt-2">
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Settings</h1>

    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-xl font-semibold">About</h2>

      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Version:</dt>
          <dd class="text-foreground">{version}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Build Date:</dt>
          <dd class="text-foreground">{buildTime}</dd>
        </div>
      </dl>

      <Button onclick={checkForUpdates} class="mt-3 w-full"
        >Check for Updates</Button
      >
    </section>

    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-xl font-semibold">Hosting</h2>

      <Label for="url">Sync Server URL</Label>
      <Input
        type="url"
        id="url"
        placeholder="wss://my-super-server"
        bind:value={url}
      />

      <Button class="mt-3 w-full" onclick={save}>Save</Button>
    </section>

    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-xl font-semibold">Appearance</h2>

      <div class="grid grid-cols-3 gap-2">
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          onclick={() => (theme = 'light')}>Light</Button
        >
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          onclick={() => (theme = 'dark')}>Dark</Button
        >
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          onclick={() => (theme = 'system')}>System</Button
        >
      </div>

      <div class="mt-4 flex items-center justify-between gap-3 rounded-md border p-3">
        <div>
          <p class="text-sm font-medium">Highlight color</p>
          <p class="text-xs text-muted-foreground">Used for primary accents and focus ring</p>
        </div>
        <Input
          type="color"
          bind:value={highlight}
          class="h-10 w-16 cursor-pointer rounded-md p-1"
          aria-label="Highlight color"
        />
      </div>

      <Button class="mt-3 w-full" onclick={saveAppearance}>Save Appearance</Button>
    </section>

    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-xl font-semibold">Collaboration</h2>

      <Label for="rootname">List Name</Label>
      <Input
        type="text"
        id="rootname"
        placeholder="default"
        bind:value={rootName}
      />

      <Label for="rootdocid" class="mt-3 block">ID (rootdocID)</Label>
      <Input
        type="text"
        id="rootdocid"
        placeholder="..."
        bind:value={newRootId}
      />
      <Button
        variant="secondary"
        class="mt-3 w-full"
        onclick={saveRootLink}>Save Link</Button
      >
      <Button
        variant="secondary"
        class="mt-3 w-full"
        onclick={() => (newRootId = $persistedRootUrl)}><Undo2 />Reset</Button
      >
      <Button
        variant="secondary"
        class="mt-3 w-full"
        onclick={createNewList}>Create New List</Button
      >
      <Button
        variant="secondary"
        class="mt-3 w-full"
        disabled={isShareDisabled}
        onclick={share}><Share />Copy & Share</Button
      >
      <Button
        disabled={isUpdateDisabled}
        class="mt-3 w-full"
        onclick={updateRootDoc}><Check />Activate Entered List</Button
      >

      <div class="mt-4 space-y-2">
        <p class="text-sm font-medium">Saved Lists</p>
        {#if savedRootLinks.length === 0}
          <p class="text-muted-foreground text-sm">No saved links yet</p>
        {:else}
          {#each savedRootLinks as link, index (getSavedListKey(link, index))}
            <div
              class={`flex items-center justify-between gap-2 rounded-md border p-2 ${link.url === $persistedRootUrl
                ? 'border-primary bg-primary/10'
                : ''}`}
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold">{link.name}</p>
                <p class="text-muted-foreground truncate text-xs">{link.url}</p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant={link.url === $persistedRootUrl ? 'default' : 'outline'}
                  onclick={() => activateRootLink(link)}
                  >{link.url === $persistedRootUrl ? 'Active' : 'Use'}</Button
                >
                {#if !isDefaultLink(link)}
                  <button
                    class={`relative overflow-hidden rounded-md border px-3 py-2 transition-colors duration-200 ${confirmingDeleteKey ===
                    getSavedListKey(link, index)
                      ? 'border-red-500 text-white'
                      : 'text-slate-500'}`}
                    aria-label={`Delete saved list ${link.name}`}
                    onclick={() => handleDeleteSavedLink(link, index)}
                  >
                    <span
                      class="absolute inset-0 bg-red-500 transition-transform duration-200 ease-out"
                      style:transform={confirmingDeleteKey === getSavedListKey(link, index)
                        ? 'translateX(0)'
                        : 'translateX(100%)'}
                    ></span>
                    <Trash2
                      class={`relative z-10 size-4 transition-colors duration-200 ${confirmingDeleteKey ===
                      getSavedListKey(link, index)
                        ? 'text-white'
                        : 'text-slate-500'}`}
                    />
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </section>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Button class="w-full" variant="secondary" onclick={importListMap}
        ><Upload />Import List Map</Button
      >
      <Button class="w-full" variant="secondary" onclick={exportListMap}
        ><Download />Export List Map</Button
      >
    </div>
  </section>
</main>
