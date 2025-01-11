<script lang="ts">
  import Button from '$src/lib/components/ui/button/button.svelte'
  import { toast } from 'svelte-sonner'
  import { useRegisterSW } from 'virtual:pwa-register/svelte'

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({})

  let version = $state('1.0.0 (WIP)')
  let buildDate = $state('02.01.2025 at 12:48 (WIP)')

  async function checkForUpdates() {
    if ($needRefresh) {
      toast('New update available!', {
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: 'Update Now',
          onClick: () => {
            updateServiceWorker()
            window.location.reload()
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
</script>

<main class="container space-y-6 p-6 pt-2 sm:w-[350px]">
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
          <dd class="text-gray-900">{buildDate}</dd>
        </div>
      </dl>

      <Button onclick={checkForUpdates} size="sm" class="mt-3 w-full"
        >Check for Updates</Button
      >
    </section>
  </section>
</main>
