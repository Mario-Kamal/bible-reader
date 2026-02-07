// Service Worker for Push Notifications
// This SW handles push events. VitePWA generates a separate SW for caching.

self.addEventListener('push', function(event) {
  console.log('Push message received:', event);
  
  let data = {
    title: 'رحلة الكتاب المقدس 📖',
    body: 'موضوع جديد متاح للقراءة!',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'new-topic',
    data: { url: '/home' }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('Error parsing push data:', e);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: data.data
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();

  const url = event.notification.data?.url || '/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Do NOT add install/activate handlers here - VitePWA handles those
// This SW is registered separately just for push notifications
