self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {
    title: 'BetterThoughts',
    body: 'Como você está agora? Tire um momento para registrar no seu diário.',
    url: '/',
    tag: 'betterthoughts-reminder',
  }

  try {
    const parsed = event.data.json()
    payload = { ...payload, ...parsed }
  } catch {
    const text = event.data.text()
    if (text) {
      payload.body = text
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      tag: payload.tag,
      renotify: true,
      data: {
        url: payload.url || '/',
      },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetFullUrl = new URL(targetUrl, self.location.origin).href

      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url === targetFullUrl) {
            return client.focus()
          }
          if ('navigate' in client) {
            return client.navigate(targetFullUrl).then((navigated) => navigated?.focus() ?? client.focus())
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetFullUrl)
      }
      return undefined
    })
  )
})

