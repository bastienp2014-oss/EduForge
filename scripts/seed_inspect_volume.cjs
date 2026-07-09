/**
 * Expected Totals:
 *
 * Section A (Tenants)
 * tenant1:
 *  - niveaux: 0
 *  - chapitres: 0
 *  - lecons: 0
 *
 * tenant2:
 *  - niveaux: 2
 *  - chapitres: 3
 *  - lecons: 6
 *  - repartition type: theorie: 3, jeu: 3
 *  - repartition mechanic: flashcard: 1, undefined/sans: 1, quiz: 1
 *
 * Section B (Utilisateurs)
 * Total utilisateurs: 4
 * Utilisateurs avec customContentItems non vide: 3
 * Total customContentItems: 10
 * Repartition par module:
 *  - mots: 2
 *  - quiz: 1
 *  - anglicismes: 2
 *  - autre: 5
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Connect to local emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const app = initializeApp({
  projectId: 'eduforge-rules-test'
});

const db = getFirestore(app);

async function seed() {
  console.log("Seeding data...");

  // Tenants
  await db.doc('tenants/tenant1/configuration/progression').set({
    niveaux: []
  });

  await db.doc('tenants/tenant2/configuration/progression').set({
    niveaux: [
      {
        id: 1,
        nom: "Niveau 1",
        seuilScore: 100,
        chapitres: [
          {
            id: "c1",
            nom: "Chapitre 1",
            lecons: [
              { id: "l1", nom: "L1", type: "theorie", tags: [] },
              { id: "l2", nom: "L2", type: "theorie", tags: [] },
              { id: "l3", nom: "L3", type: "jeu", mechanic: "flashcard", tags: [] }
            ]
          },
          {
            id: "c2",
            nom: "Chapitre 2",
            lecons: [
              { id: "l4", nom: "L4", type: "theorie", tags: [] },
              { id: "l5", nom: "L5", type: "jeu", tags: [] } // No mechanic
            ]
          }
        ]
      },
      {
        id: 2,
        nom: "Niveau 2",
        seuilScore: 200,
        chapitres: [
          {
            id: "c3",
            nom: "Chapitre 3",
            lecons: [
              { id: "l6", nom: "L6", type: "jeu", mechanic: "quiz", tags: [] }
            ]
          }
        ]
      }
    ]
  });

  // Users
  await db.doc('utilisateurs/user1').set({
    tenantId: 'tenant1',
    // customContentItems omitted, simulating empty or missing
  });

  await db.doc('utilisateurs/user2').set({
    tenantId: 'tenant2',
    customContentItems: [
      { id: "i1", module: "mots", niveau: 1, tags: [], payload: { answer: "A" } },
      { id: "i2", module: "mots", niveau: 1, tags: [], payload: { answer: "B" } },
      { id: "i3", module: "quiz", niveau: 2, tags: [], payload: { answer: "C" } }
    ]
  });

  await db.doc('utilisateurs/user3').set({
    tenantId: 'tenant2',
    customContentItems: [
      { id: "i4", module: "anglicismes", niveau: 1, tags: [], payload: { answer: "A" } },
      { id: "i5", module: "anglicismes", niveau: 1, tags: [], payload: { answer: "B" } }
    ]
  });

  await db.doc('utilisateurs/user4').set({
    tenantId: 'tenant1',
    customContentItems: [
      { id: "i6", module: "autre", niveau: 1, tags: [], payload: { answer: "A" } },
      { id: "i7", module: "autre", niveau: 1, tags: [], payload: { answer: "B" } },
      { id: "i8", module: "autre", niveau: 1, tags: [], payload: { answer: "C" } },
      { id: "i9", module: "autre", niveau: 1, tags: [], payload: { answer: "D" } },
      { id: "i10", module: "autre", niveau: 1, tags: [], payload: { answer: "E" } }
    ]
  });

  console.log("Seeding done.");
}

seed().then(() => process.exit(0)).catch(console.error);
