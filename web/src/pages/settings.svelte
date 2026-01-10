<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import { Label } from '$lib/components/ui/label'
  import { Share, Undo2, Check } from 'lucide-svelte'

  import { toast } from 'svelte-sonner'
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  import { persistedRootUrl, syncServerUrl } from '$src/lib/core/repo'
  import { tick } from 'svelte'
  import type { AutomergeUrl } from '@automerge/automerge-repo'

  const { needRefresh, updateServiceWorker } = useRegisterSW({})

  interface Props {
    setRootId: (newId: AutomergeUrl) => Promise<null | string>
  }
  const { setRootId }: Props = $props()

  let version = $state('1.0.0 (WIP)')
  let buildTime = $state(__BUILD_TIME__)
  let url = $state($syncServerUrl)
  let newRootId = $state($persistedRootUrl)
  let isShareDisabled = $derived(!newRootId)
  let isUpdateDisabled = $derived(!newRootId || newRootId === $persistedRootUrl)

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

  async function updateRootDoc() {
    let loadingToast = toast.loading('Wait...', { position: 'bottom-center' })

    // Uncomment the line below to test the toast
    // await new Promise(resolve => setTimeout(resolve, 2000))

    const error = await setRootId(newRootId)
    if (error != null) {
      toast.error(error, { id: loadingToast })
    } else {
      toast.success('Root document has been changed', { id: loadingToast })
    }

    await tick()
  }
</script>

<main class="container pt-2">
  <section class="space-y-6">
    <h1 class="text-3xl font-bold">Settings</h1>

    <section class="rounded-lg border p-4">
      <h2 class="mb-3 text-xl font-semibold">About</h2>

      <dl class="space-y-2">
        <div class="flex justify-between">
          <dt class="text-gray-600">Version:</dt>
          <dd class="text-gray-900">{version}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-gray-700">Build Date:</dt>
          <dd class="text-gray-900">{buildTime}</dd>
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
      <h2 class="mb-3 text-xl font-semibold">Collaboration</h2>

      <Label for="rootdocid">ID (rootdocID)</Label>
      <Input
        type="text"
        id="rootdocid"
        placeholder="..."
        bind:value={newRootId}
      />
      <Button
        variant="secondary"
        class="mt-3 w-full"
        disabled={isShareDisabled}
        onclick={share}><Share />Copy & Share</Button
      >
      <Button
        variant="secondary"
        class="mt-3 w-full"
        onclick={() => (newRootId = $persistedRootUrl)}><Undo2 />Reset</Button
      >
      <Button
        disabled={isUpdateDisabled}
        class="mt-3 w-full"
        onclick={updateRootDoc}><Check />Update</Button
      >
    </section>
  </section>
</main>
