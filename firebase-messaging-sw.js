/* 쌉싸오톡 백그라운드 푸시 알림 서비스 워커 */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCUizcPj8AX7ExqX1jMjeVwnX0vQ_jbswk",
  authDomain: "chat-f04e4.firebaseapp.com",
  projectId: "chat-f04e4",
  storageBucket: "chat-f04e4.firebasestorage.app",
  messagingSenderId: "1039029961929",
  appId: "1:1039029961929:web:176dde5fe9n3e0a54ff918",
  databaseURL: "https://chat-f04e4-default-rtdb.firebaseio.com"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const data = payload && payload.data ? payload.data : {};
  const title = data.title || '쌉싸오톡 새 메시지';
  const options = {
    body: data.body || '새 메시지가 도착했습니다.',
    icon: 'https://cdn-icons-png.flaticon.com/512/6995/6995699.png',
    tag: data.roomId || 'ssapsao-message',
    data: { url: self.location.origin + '/', roomId: data.roomId || '' }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : self.location.origin + '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) {
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
