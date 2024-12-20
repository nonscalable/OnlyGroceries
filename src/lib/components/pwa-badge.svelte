<script lang="ts">
  import { useRegisterSW } from 'virtual:pwa-register/svelte'
  import { toast } from 'svelte-sonner'
  import { Toaster } from '$src/lib/components/ui/sonner'

  // check for updates every 3 minutes
  const period = 1 * 3 * 1000

  /**
   * This function will register a periodic sync check every hour, you can modify the interval as needed.
   */
  function registerPeriodicSync(swUrl: string, r: ServiceWorkerRegistration) {
    if (period <= 0) return

    setInterval(async () => {
      if ('onLine' in navigator && !navigator.onLine) return

      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          'cache': 'no-store',
          'cache-control': 'no-cache'
        }
      })

      if (resp?.status === 200) await r.update()
    }, period)
  }

  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return
      if (r?.active?.state === 'activated') {
        registerPeriodicSync(swUrl, r)
      } else if (r?.installing) {
        r.installing.addEventListener('statechange', e => {
          const sw = e.target as ServiceWorker
          if (sw.state === 'activated') registerPeriodicSync(swUrl, r)
        })
      }
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
