import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, initializeFirestore } from "firebase/firestore";
const firebaseConfig = {
  "projectId": "gen-lang-client-0808256771",
  "appId": "1:906490759700:web:abba0155b3d3f6e5c33501",
  "apiKey": "AIzaSyCp9VBssCMQFQv2kzN7ZX6dT3SsMh4C0jQ",
  "authDomain": "gen-lang-client-0808256771.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
async function run() {
  try {
    const docSnap = await getDoc(doc(db, "configuration", "theme"));
    console.log("Success:", docSnap.exists() ? "exists" : "not found");
  } catch(e) {
    console.error("Read Error:", e.message);
  }
  process.exit(0);
}
run();
