import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// Preuve exécutable de l'AC "site Astro fonctionnel" (plan.md Phase 0, item
// "Lecture publique Firestore réduite") : après le passage de tenants/{tenantId}
// à `read: if true` -> `isSignedIn()`, le SSR Astro (marketing-site/src/lib/tenantApi.ts)
// doit continuer de retourner les VRAIES données du tenant (pas le fallback de démo),
// puisqu'il lit désormais via le SDK Admin (bypass des règles), pas via le SDK client.
//
// Contre l'émulateur Firestore réel (voir `npm run test:rules`), pas un mock.

const PROJECT_ID = 'eduforge-rules-test';
const DATABASE_ID = 'ai-studio-f07a6670-0671-4de0-9caf-b551ab6f37a7';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;

let getTenantConfig: typeof import('./tenantApi').getTenantConfig;
let adminDb: FirebaseFirestore.Firestore;

beforeAll(async () => {
  const { initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  initializeApp({ projectId: PROJECT_ID });
  adminDb = getFirestore(DATABASE_ID);

  ({ getTenantConfig } = await import('./tenantApi'));
});

afterEach(async () => {
  const snapshot = await adminDb.collection('tenants').get();
  await Promise.all(snapshot.docs.map((d) => d.ref.delete()));
});

afterAll(async () => {
  const { getApps, deleteApp } = await import('firebase-admin/app');
  await Promise.all(getApps().map((app) => deleteApp(app)));
});

describe('marketing-site tenantApi.getTenantConfig — SDK Admin contre émulateur Firestore', () => {
  it('retourne les vraies données du tenant trouvé par domaine (pas le fallback de démo)', async () => {
    await adminDb.collection('tenants').doc('tenant-astro-1').set({
      name: 'Académie Réelle',
      domain: 'academie-reelle.example.com',
      theme: { primary: '#ff0000', secondary: '#ffcccc', background: '#fff', text: '#000', fontFamily: 'Inter' },
      marketing: { siteTitle: 'Académie Réelle', heroTitle: 'Bienvenue chez nous', heroSubtitle: 'Sous-titre réel' },
    });

    const config = await getTenantConfig('academie-reelle.example.com');

    expect(config).not.toBeNull();
    expect(config?.id).toBe('tenant-astro-1');
    expect(config?.marketing.siteTitle).toBe('Académie Réelle');
    expect(config?.theme.primary).toBe('#ff0000');
    // Le fallback de démo utilise toujours ce titre — s'assurer qu'on ne le reçoit jamais ici
    expect(config?.marketing.siteTitle).not.toBe('Plateforme Interactive');
  });

  it('retombe sur le fallback de démo si le tenant est réellement introuvable', async () => {
    const config = await getTenantConfig('domaine-qui-nexiste-pas.example.com');

    expect(config).not.toBeNull();
    expect(config?.marketing.siteTitle).toBe('Plateforme Interactive');
  });
});
