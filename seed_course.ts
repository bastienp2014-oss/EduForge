import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function seed() {
  const tenants = await db.collection('tenants').get();
  if (tenants.empty) {
    console.log("No tenants found.");
    return;
  }
  const tenantId = tenants.docs[0].id;
  console.log("Found tenant:", tenantId);
}
seed().catch(console.error);
