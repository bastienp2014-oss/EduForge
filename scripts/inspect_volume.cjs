const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Parsing CLI
let targetTenant = null;
let limitUsers = null;
let confirmProduction = false;

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--tenant=')) {
    targetTenant = arg.split('=')[1];
  } else if (arg.startsWith('--limit=')) {
    limitUsers = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--confirm-production') {
    confirmProduction = true;
  }
}

// 2. Emulator / Production safety check
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`\n🧪 MODE ÉMULATEUR — host: ${process.env.FIRESTORE_EMULATOR_HOST}\n`);
} else {
  if (!confirmProduction) {
    console.error(`\n⚠️ AUCUN ÉMULATEUR DÉTECTÉ — cible potentiellement un projet Firebase réel`);
    console.error(`Exécution refusée. Utilisez --confirm-production pour forcer l'exécution sur la base de production.\n`);
    process.exit(1);
  } else {
    console.warn(`\n⚠️ ATTENTION: Exécution sur le projet Firebase de production confirmée.\n`);
  }
}

// For emulator, we need projectId
const appOptions = {};
if (process.env.FIRESTORE_EMULATOR_HOST) {
    appOptions.projectId = 'eduforge-rules-test';
}
const app = initializeApp(appOptions);
const db = getFirestore(app);

async function inspectVolume() {
  console.log("=========================================");
  console.log("= SECTION A : TENANTS (Progression)     =");
  console.log("=========================================\n");

  let tenantsQuery = db.collection('tenants');
  const tenantsSnapshot = await tenantsQuery.get();

  for (const tenantDoc of tenantsSnapshot.docs) {
    const tenantId = tenantDoc.id;
    if (targetTenant && tenantId !== targetTenant) continue;

    console.log(`Tenant : ${tenantId}`);
    const progressionDoc = await db.doc(`tenants/${tenantId}/configuration/progression`).get();

    let nbNiveaux = 0;
    let nbChapitres = 0;
    let nbLecons = 0;
    let leconsTheorie = 0;
    let leconsJeu = 0;
    let mechanics = {};
    let sizeBytes = 0;

    if (progressionDoc.exists) {
      const data = progressionDoc.data();
      sizeBytes = Buffer.byteLength(JSON.stringify(data), 'utf8');

      if (data.niveaux && Array.isArray(data.niveaux)) {
        nbNiveaux = data.niveaux.length;

        for (const niveau of data.niveaux) {
          if (niveau.chapitres && Array.isArray(niveau.chapitres)) {
            nbChapitres += niveau.chapitres.length;

            for (const chapitre of niveau.chapitres) {
              if (chapitre.lecons && Array.isArray(chapitre.lecons)) {
                nbLecons += chapitre.lecons.length;

                for (const lecon of chapitre.lecons) {
                  if (lecon.type === 'theorie') {
                    leconsTheorie++;
                  } else if (lecon.type === 'jeu') {
                    leconsJeu++;
                    const mechanicName = lecon.mechanic || 'undefined';
                    mechanics[mechanicName] = (mechanics[mechanicName] || 0) + 1;
                  }
                }
              }
            }
          }
        }
      }
    }

    console.log(`  - Niveaux : ${nbNiveaux}`);
    console.log(`  - Chapitres : ${nbChapitres}`);
    console.log(`  - Leçons : ${nbLecons}`);
    console.log(`  - Type leçons -> Théorie : ${leconsTheorie} | Jeu : ${leconsJeu}`);
    if (leconsJeu > 0) {
      console.log(`  - Mécaniques jeu :`);
      for (const [mech, count] of Object.entries(mechanics)) {
        console.log(`      * ${mech} : ${count}`);
      }
    }
    console.log(`  - Taille approx : ${sizeBytes} octets\n`);
  }

  console.log("=========================================");
  console.log("= SECTION B : UTILISATEURS (Items)      =");
  console.log("=========================================\n");

  let utilColl = db.collection('utilisateurs');
  if (targetTenant) {
    utilColl = utilColl.where('tenantId', '==', targetTenant);
  }
  const countSnapshot = await utilColl.count().get();
  console.log(`Estimation (count) totale d'utilisateurs : ${countSnapshot.data().count}\n`);

  let totalUtilisateurs = 0;
  let utilsAvecItems = 0;
  let totalItems = 0;
  let modulesCount = {};
  let maxSize = 0;
  let totalSize = 0;

  const pageSize = 500;
  let lastVisible = null;
  let hasMore = true;

  while (hasMore) {
    let q = utilColl.limit(pageSize);
    if (lastVisible) {
      q = q.startAfter(lastVisible);
    }
    const utilsSnap = await q.get();

    if (utilsSnap.empty) {
      hasMore = false;
      break;
    }

    for (const doc of utilsSnap.docs) {
      if (limitUsers && totalUtilisateurs >= limitUsers) {
        hasMore = false;
        break;
      }

      totalUtilisateurs++;
      const data = doc.data();

      const customContentItems = data.customContentItems || [];
      const docSize = Buffer.byteLength(JSON.stringify(customContentItems), 'utf8');

      totalSize += docSize;
      if (docSize > maxSize) {
        maxSize = docSize;
      }

      if (customContentItems.length > 0) {
        utilsAvecItems++;
        totalItems += customContentItems.length;

        for (const item of customContentItems) {
          const mod = item.module || 'undefined';
          modulesCount[mod] = (modulesCount[mod] || 0) + 1;
        }
      }
    }

    lastVisible = utilsSnap.docs[utilsSnap.docs.length - 1];

    if (utilsSnap.docs.length < pageSize || (limitUsers && totalUtilisateurs >= limitUsers)) {
      hasMore = false;
    }
  }

  const avgSize = totalUtilisateurs > 0 ? Math.round(totalSize / totalUtilisateurs) : 0;

  console.log(`Total utilisateurs traités : ${totalUtilisateurs}`);
  console.log(`Utilisateurs avec customContentItems non vide : ${utilsAvecItems}`);
  console.log(`Somme totale d'items (tous utilisateurs) : ${totalItems}`);

  if (totalItems > 0) {
    console.log(`Répartition par module :`);
    for (const [mod, count] of Object.entries(modulesCount)) {
      console.log(`  - ${mod} : ${count}`);
    }
  }

  console.log(`\nTaille customContentItems :`);
  console.log(`  - Moyenne : ${avgSize} octets par utilisateur`);
  console.log(`  - Maximum : ${maxSize} octets\n`);

  console.log("Inspection terminée.");
}

inspectVolume().catch(console.error);
