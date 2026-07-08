import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Preuve exécutable de l'AC "Lecture publique Firestore réduite" (plan.md Phase 0) :
// tenants/{tenantId} passe de `read: if true` à `read: if isSignedIn()`.

// Preuve exécutable de l'AC "Config tenant en BDD" (plan.md Phase 1) contre le
// firestore.rules réel du repo, via l'émulateur Firestore — pas une lecture de code.

let testEnv: RulesTestEnvironment;

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'eduforge-rules-test',
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

describe('firestore.rules — tenants/{tenantId}/configuration', () => {
  it('refuse la lecture non authentifiée (durcissement isSignedIn())', async () => {
    const unauth = testEnv.unauthenticatedContext();
    const ref = doc(unauth.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig');
    await assertFails(getDoc(ref));
  });

  it('autorise la lecture pour tout utilisateur signé (isSignedIn())', async () => {
    const user = testEnv.authenticatedContext('regular-user', { role: 'creator', tenantId: TENANT_A });
    const ref = doc(user.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig');
    await assertSucceeds(getDoc(ref));
  });

  it('refuse l\'écriture pour un utilisateur signé non-admin du tenant', async () => {
    const user = testEnv.authenticatedContext('regular-user', { role: 'creator', tenantId: TENANT_A });
    const ref = doc(user.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig');
    await assertFails(setDoc(ref, { appName: 'Hack' }));
  });

  it('autorise l\'écriture pour un admin du tenant (role=admin, même tenantId)', async () => {
    const admin = testEnv.authenticatedContext('tenant-admin', { role: 'admin', tenantId: TENANT_A });
    const ref = doc(admin.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig');
    await assertSucceeds(setDoc(ref, { appName: 'Nouveau nom' }));
  });

  it('autorise l\'écriture pour un owner du tenant (role=owner, même tenantId)', async () => {
    const owner = testEnv.authenticatedContext('tenant-owner', { role: 'owner', tenantId: TENANT_A });
    const ref = doc(owner.firestore(), 'tenants', TENANT_A, 'configuration', 'games');
    await assertSucceeds(setDoc(ref, { games: [] }));
  });

  it('autorise l\'écriture pour un superadmin, peu importe le tenant', async () => {
    const superadmin = testEnv.authenticatedContext('superadmin-user', { role: 'superadmin', tenantId: TENANT_B });
    const ref = doc(superadmin.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig');
    await assertSucceeds(setDoc(ref, { appName: 'Modifié par superadmin' }));
  });

  it('isolation inter-tenant : un admin du tenant A ne peut pas écrire la config du tenant B', async () => {
    const adminOfA = testEnv.authenticatedContext('tenant-a-admin', { role: 'admin', tenantId: TENANT_A });
    const ref = doc(adminOfA.firestore(), 'tenants', TENANT_B, 'configuration', 'appConfig');
    await assertFails(setDoc(ref, { appName: 'Intrusion' }));
  });

  it('isolation inter-tenant : la lecture du tenant B reste indépendante de celle du tenant A', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig'), { appName: 'Config A' });
      await setDoc(doc(ctx.firestore(), 'tenants', TENANT_B, 'configuration', 'appConfig'), { appName: 'Config B' });
    });

    const user = testEnv.authenticatedContext('any-user', { role: 'creator', tenantId: TENANT_A });
    const snapA = await getDoc(doc(user.firestore(), 'tenants', TENANT_A, 'configuration', 'appConfig'));
    const snapB = await getDoc(doc(user.firestore(), 'tenants', TENANT_B, 'configuration', 'appConfig'));

    expect(snapA.data()?.appName).toBe('Config A');
    expect(snapB.data()?.appName).toBe('Config B');
  });
});

describe('firestore.rules — tenants/{tenantId} (document racine)', () => {
  it('refuse la lecture non authentifiée (durcissement isSignedIn())', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tenants', TENANT_A), { name: 'Tenant A', domain: 'tenant-a.example.com' });
    });

    const unauth = testEnv.unauthenticatedContext();
    const ref = doc(unauth.firestore(), 'tenants', TENANT_A);
    await assertFails(getDoc(ref));
  });

  it('autorise la lecture pour tout utilisateur signé (isSignedIn())', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'tenants', TENANT_A), { name: 'Tenant A', domain: 'tenant-a.example.com' });
    });

    const user = testEnv.authenticatedContext('regular-user', { role: 'creator', tenantId: TENANT_A });
    const ref = doc(user.firestore(), 'tenants', TENANT_A);
    const snap = await assertSucceeds(getDoc(ref));
    expect(snap.data()?.name).toBe('Tenant A');
  });
});
