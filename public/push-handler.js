// Web Push handler — registered in the service worker via workbox.importScripts.
// Listens for push events and shows native OS notifications, plus handles clicks.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Conciertos Latam', body: event.data.text() };
  }

  const title = payload.title || 'Conciertos Latam';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/pwa-icon-192.png',
    badge: payload.badge || '/pwa-icon-192.png',
    tag: payload.tag,
    data: { url: payload.url || '/admin/operations' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin/operations';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // If there's an open tab on the same origin, focus and navigate it
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
    })()
  );
});
