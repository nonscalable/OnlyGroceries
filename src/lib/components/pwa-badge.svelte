<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'
  import { toast } from 'svelte-sonner'
  import { Toaster } from '$src/lib/components/ui/sonner'

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(swr) {
      console.log(`SW registered: ${swr}`)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })

  offlineReady.subscribe(value => {
    if (value) {
      toast('App is ready to work offline.', {
        duration: Number.POSITIVE_INFINITY,
        action: { label: 'Close', onClick: () => close() }
      })
    }
  })

  needRefresh.subscribe(value => {
    if (value) {
      toast('New content available. Click on reload button to update.', {
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: 'Reload',
          onClick: () => {
            updateServiceWorker()
            window.location.reload()
          }
        }
      })
    }
  })
  function close() {
    offlineReady.set(false)
    needRefresh.set(false)
  }
</script>

<Toaster />
