import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const firebaseConfig = {
  "projectId": "gen-lang-client-0808256771",
  "appId": "1:906490759700:web:abba0155b3d3f6e5c33501",
  "apiKey": "AIzaSyCp9VBssCMQFQv2kzN7ZX6dT3SsMh4C0jQ",
  "authDomain": "gen-lang-client-0808256771.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-f07a6670-0671-4de0-9caf-b551ab6f37a7",
  "storageBucket": "gen-lang-client-0808256771.firebasestorage.app",
  "messagingSenderId": "906490759700"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-f07a6670-0671-4de0-9caf-b551ab6f37a7");
async function run() {
  const snap = await getDocs(collection(db, "tenants"));
  snap.forEach(doc => console.log(doc.id, doc.data()));
}
run();
