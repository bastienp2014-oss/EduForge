importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Workbox precaching for App Shell
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
if (workbox) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}

try {
  const firebaseConfig = __FIREBASE_CONFIG__;
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload?.notification?.title || 'Notification';
    const notificationOptions = {
      body: payload?.notification?.body || '',
      icon: '/money/100.png'
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.error("Failed to initialize firebase in SW", e);
}

