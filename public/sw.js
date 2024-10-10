const CACHE_NAME = 'cache-v1'

// Function to fetch the manifest and get the hashed asset filenames (JS and CSS)
async function getHashedAssets() {
  const response = await fetch('/.vite/manifest.json')
  const manifest = await response.json()

  const assetFiles = []

  // Loop through each entry in the manifest
  Object.values(manifest).forEach(entry => {
    assetFiles.push(`/${entry.file}`)
    if (entry.css) {
      entry.css.forEach(cssFile => {
        assetFiles.push(`/${cssFile}`)
      })
    }
  })

  return assetFiles
}

// Install event: cache the hashed JS, CSS, and other static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const hashedAssets = await getHashedAssets()

      return cache.addAll([
        '/',
        '/index.html',
        '/app.webmanifest',
        '/icon-192.png',
        '/icons-512.png',
        '/icon.svg',
        ...hashedAssets
      ])
    })
  )
  self.skipWaiting()
})

// Activate event: clear old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (!cacheWhitelist.includes(key)) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event: respond with cache first, then network if not cached
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request)
    })
  )
})
