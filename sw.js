// 쌉싸오톡 서비스 워커 + Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCUizcPj8AX7ExqX1jMjeVwnX0vQ_jbswk",
  authDomain: "chat-f04e4.firebaseapp.com",
  projectId: "chat-f04e4",
  storageBucket: "chat-f04e4.firebasestorage.app",
  messagingSenderId: "1039029961929",
  appId: "1:1039029961929:web:176dde5fe9n3e0a54ff918",
  measurementId: "G-5KCGZHJN21",
  databaseURL: "https://chat-f04e4-default-rtdb.firebaseio.com"
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Cloud Function sends data-only messages; display them here while the app is closed/backgrounded.
messaging.setBackgroundMessageHandler((payload) => {
  const data = payload && payload.data ? payload.data : {};
  const title = data.title || '쌉싸오톡 새 메시지';
  const options = {
    body: data.body || '새 메시지가 도착했습니다.',
    icon: 'https://cdn-icons-png.flaticon.com/512/6995/6995699.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/6995/6995699.png',
    tag: data.messageId ? `ssapsao-${data.messageId}` : `ssapsao-${Date.now()}`,
    renotify: true,
    data: { url: data.url || '/', roomId: data.roomId || '' }
  };
  return self.registration.showNotification(title, options);
});

// 알림을 누르면 열려 있는 쌉싸오톡 창으로 이동하거나 새 창을 엽니다.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(new URL(targetUrl, self.location.origin).href);
    })
  );
});
