<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'
  import { toast } from 'svelte-sonner'
  import { Toaster } from '$src/lib/components/ui/sonner'

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swr) {
      console.log(`SW registered: ${swr}`)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })

  offlineReady.subscribe(value => {
    if (value) {
      toast('App is ready to work offline.', {
        position: 'bottom-center',
        duration: Number.POSITIVE_INFINITY,
        cancel: { label: 'Close' }
      })
    }
  })

  needRefresh.subscribe(value => {
    if (value) {
      toast('New content available. Click on reload button to update.', {
        position: 'bottom-center',
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: 'Reload',
          onClick: () => {
            updateServiceWorker()
          }
        },
        cancel: {
          label: 'Not now'
        }
      })
    }
  })
  function close() {
    offlineReady.set(false)
    needRefresh.set(false)
  }
</script>

<Toaster position="top-center" richColors />

<style>
  :global([data-sonner-toaster][data-y-position='bottom']) {
    bottom: 48px !important;
  }
  :global([data-sonner-toaster][data-y-position='top']) {
    top: env(safe-area-inset-top) !important;
  }
</style>
