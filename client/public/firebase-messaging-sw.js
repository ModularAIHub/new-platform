importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your_api_key",
  authDomain: "your_auth_domain",
  projectId: "your_project_id",
  storageBucket: "your_storage_bucket",
  messagingSenderId: "your_messaging_sender_id",
  appId: "your_app_id",
  measurementId: "your_measurement_id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};

  const notificationOptions = {
    body: body || 'You have a new notification',
    icon: icon || '/logo.png',
    badge: '/badge.png',
    tag: payload.collapseKey || 'suitegenie-notification',
    data: payload.data || {},
    actions: getNotificationActions(payload.data?.type)
  };

  self.registration.showNotification(
    title || 'SuiteGenie',
    notificationOptions
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data;
  let urlToOpen = 'https://suitegenie.in/dashboard';

  if (notifData?.type === 'post_failed') {
    urlToOpen = 'https://suitegenie.in/scheduling';
  } else if (notifData?.type === 'bulk_complete') {
    urlToOpen = 'https://suitegenie.in/bulk-generation';
  } else if (notifData?.type === 'engagement_spike') {
    urlToOpen = 'https://suitegenie.in/analytics';
  } else if (notifData?.type === 'credit_warning') {
    urlToOpen = 'https://suitegenie.in/settings';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

function getNotificationActions(type) {
  if (type === 'post_failed') {
    return [
      { action: 'retry', title: 'Retry' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
  }
  if (type === 'engagement_spike') {
    return [{ action: 'view', title: 'View Analytics' }];
  }
  return [];
}
