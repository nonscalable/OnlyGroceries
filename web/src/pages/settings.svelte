<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import Input from '$lib/components/ui/input/input.svelte'
  import { Label } from '$lib/components/ui/label'

  import { toast } from 'svelte-sonner'
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  import { rootdocID, syncServerUrl } from '$stores/settings'
  import { g } from '$stores/global.svelte'
  import { tick } from 'svelte'

  const { needRefresh, updateServiceWorker } = useRegisterSW({})

  let version = $state('1.0.0 (WIP)')
  let buildTime = $state(__BUILD_TIME__)
  let url = $state($syncServerUrl)
  let rootID = $state($rootdocID)

  async function checkForUpdates() {
    if ($needRefresh) {
      toast('New update available!', {
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
        text: $rootdocID
      })
    } else {
      await navigator.clipboard.writeText($rootdocID)
      toast.success('List ID has been copied to clipboard', {
        description: 'Send it to your friend'
      })
    }
  }

  async function changeRootDoc() {
    let loadingToast = toast.loading('Wait!')

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      g.rootDoc?.delete()
      g.mainDoc?.delete()
      for (let id in g.specialDocs) {
        g.specialDocs[id].delete()
      }

      g.rootDoc = undefined
      g.mainDoc = undefined
      g.specialDocs = {}

      $rootdocID = rootID
    } catch (err) {
      toast.error(
        `Error: ${(err as Error).message || 'Something went wrong'}`,
        { id: loadingToast }
      )
    } finally {
      await tick()

      toast.success('Root document has been changed', { id: loadingToast })
    }
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
      <Input type="text" id="rootdocid" placeholder="..." bind:value={rootID} />
      <Button class="mt-3 w-full" onclick={share}>Share</Button>

      <Button class="mt-3 w-full" onclick={changeRootDoc}>Change</Button>
    </section>
  </section>
</main>
