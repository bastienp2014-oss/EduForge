import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerForPush(userId: string) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    try {
      const messaging = getMessaging(app);
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn("VAPID key is missing, skipping push registration.");
        return;
      }
      
      // VitePWA handles the SW registration natively.
      const registration = await navigator.serviceWorker.ready;

      const currentToken = await getToken(messaging, { 
        vapidKey, 
        serviceWorkerRegistration: registration 
      });
      
      if (currentToken) {
        await setDoc(doc(db, "utilisateurs", userId), { fcmToken: currentToken }, { merge: true });
        console.log("FCM Token saved for user.");
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } catch (err) {
      console.error("An error occurred while retrieving token. ", err);
    }
  }
}

export function setupMessageListener() {
  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // In a real app we could show a toast here. For now we log.
      if (payload.notification) {
        // alert(`${payload.notification.title}\n${payload.notification.body}`);
      }
    });
  } catch (err) {
    console.error("Failed to setup message listener", err);
  }
}
