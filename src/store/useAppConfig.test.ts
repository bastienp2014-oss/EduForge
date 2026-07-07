import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

// Preuve exécutable, contre l'émulateur Firestore réel avec le firestore.rules réel,
// de l'AC "Config tenant en BDD" (plan.md Phase 1) au niveau applicatif : deux
// "navigateurs" (deux instances de store indépendantes, simulant deux sessions)
// voient la même config après édition + debounce, la migration localStorage est
// transparente, et l'isolation inter-tenant est respectée.
//
// Chaque "navigateur" est simulé via vi.resetModules() + vi.doMock() pour obtenir
// une instance fraîche du module useAppConfig (donc de son état de module tel que
// loadedTenantId et le timer de debounce), pointée vers un contexte Firestore
// authentifié différent via testEnv.authenticatedContext(uid, claims) — cela
// exerce le vrai firestore.rules (pas de bypass), sans nécessiter un émulateur Auth.

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'eduforge-store-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.doUnmock('../services/firebase');
  vi.doUnmock('./useAuth');
  vi.resetModules();
});

async function loadStoreAsUser(uid: string, claims: Record<string, unknown>) {
  const fakeDb = testEnv.authenticatedContext(uid, claims).firestore();
  vi.doMock('../services/firebase', () => ({ db: fakeDb, auth: { currentUser: null } }));
  vi.doMock('./useAuth', () => ({
    useAuth: { getState: () => ({ claims }) },
  }));
  vi.resetModules();
  const mod = await import('./useAppConfig');
  return mod.useAppConfig;
}

describe('useAppConfig — flux applicatif réel contre émulateur Firestore', () => {
  it('AC "deux navigateurs voient la même config" : édition + debounce sur A, lue par B après reload', async () => {
    const TENANT = `tenant-two-browsers-${Date.now()}`;

    // "Navigateur A" : un admin du tenant, premier chargement (aucune config existante)
    const storeA = await loadStoreAsUser('admin-a', { role: 'admin', tenantId: TENANT });
    await storeA.getState().load(TENANT);
    expect(storeA.getState().isLoaded).toBe(true);
    expect(storeA.getState().appName).toBe('Mots & Blocs');

    storeA.getState().setAppName('Académie Test E2E');

    // Laisser le debounce (2000ms dans useAppConfig.ts) écrire vers Firestore
    await new Promise((r) => setTimeout(r, 2500));

    // "Navigateur B" : un autre utilisateur signé du même tenant, nouvelle instance de store
    const storeB = await loadStoreAsUser('viewer-b', { role: 'creator', tenantId: TENANT });
    await storeB.getState().load(TENANT);
    expect(storeB.getState().appName).toBe('Académie Test E2E');
  }, 15000);

  it('AC "non-régression localStorage" : la config legacy est reprise et migrée vers Firestore', async () => {
    const TENANT = `tenant-migration-${Date.now()}`;
    localStorage.setItem('quebec-app-config', JSON.stringify({
      state: { appName: 'Config Historique Locale' },
      version: 0,
    }));

    const store = await loadStoreAsUser('admin-c', { role: 'admin', tenantId: TENANT });
    await store.getState().load(TENANT);

    // Appliqué en mémoire immédiatement, pas réinitialisé aux défauts
    expect(store.getState().appName).toBe('Config Historique Locale');

    // Et réellement écrit dans Firestore (pas seulement en mémoire) — vérifié via un
    // contexte qui bypass les rules, pour isoler la vérification de la donnée elle-même.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await ctx.firestore().doc(`tenants/${TENANT}/configuration/appConfig`).get();
      expect(snap.exists).toBe(true);
      expect(snap.data()?.appName).toBe('Config Historique Locale');
    });
  }, 15000);

  it('AC "isolation inter-tenant" : le tenant Y n\'est jamais affecté par les changements du tenant X', async () => {
    const TENANT_X = `tenant-x-${Date.now()}`;
    const TENANT_Y = `tenant-y-${Date.now()}`;

    const storeX = await loadStoreAsUser('admin-x', { role: 'admin', tenantId: TENANT_X });
    await storeX.getState().load(TENANT_X);
    storeX.getState().setAppName('Config Tenant X');
    await new Promise((r) => setTimeout(r, 2500));

    const storeY = await loadStoreAsUser('admin-y', { role: 'admin', tenantId: TENANT_Y });
    await storeY.getState().load(TENANT_Y);
    expect(storeY.getState().appName).toBe('Mots & Blocs'); // défauts, jamais la valeur de X
  }, 15000);

  it('un utilisateur non-admin ne tente jamais l\'écriture de migration (pas de doc créé)', async () => {
    const TENANT = `tenant-nonadmin-${Date.now()}`;

    const store = await loadStoreAsUser('regular-user', { role: 'creator', tenantId: TENANT });
    await store.getState().load(TENANT);
    expect(store.getState().isLoaded).toBe(true);
    expect(store.getState().appName).toBe('Mots & Blocs');

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await ctx.firestore().doc(`tenants/${TENANT}/configuration/appConfig`).get();
      expect(snap.exists).toBe(false);
    });
  }, 15000);
});
