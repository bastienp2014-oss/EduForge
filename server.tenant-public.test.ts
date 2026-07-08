import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// server.ts démarre un serveur complet (startServer()) au chargement du module, donc on
// reproduit ici la logique exacte de la route /api/tenant-public + son middleware, comme
// server.debug.test.ts le fait déjà pour /api/debug/*, plutôt que d'importer server.ts.

const mockDocGet = vi.fn();
const mockCollectionGet = vi.fn();

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ get: mockDocGet })),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({ get: mockCollectionGet })),
      })),
    })),
  })),
}));

const firebaseConfig = { firestoreDatabaseId: 'test-db' };

const requireAppCheck = async (req: any, res: any, next: any) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');
  const enforce = process.env.APP_CHECK_ENFORCE === 'true';
  if (!appCheckToken && enforce) {
    return res.status(401).json({ error: 'Non autorisé: Token App Check manquant' });
  }
  next();
};

const app = express();
app.use(express.json());

app.get("/api/tenant-public", requireAppCheck, async (req, res) => {
  try {
    const { domain, id } = req.query;
    const { getFirestore } = await import('firebase-admin/firestore');
    const db: any = getFirestore(firebaseConfig.firestoreDatabaseId);

    let docSnap: any;
    if (typeof id === 'string' && id) {
      docSnap = await db.collection('tenants').doc(id).get();
    } else if (typeof domain === 'string' && domain) {
      const snapshot = await db.collection('tenants').where('domain', '==', domain).limit(1).get();
      docSnap = snapshot.empty ? undefined : snapshot.docs[0];
    } else {
      return res.status(400).json({ error: "Paramètre 'domain' ou 'id' requis" });
    }

    if (!docSnap || !docSnap.exists) {
      return res.status(404).json({ error: "Tenant introuvable" });
    }

    const data = docSnap.data() || {};
    res.json({
      id: docSnap.id,
      name: data.name ?? null,
      plan: data.plan ?? null,
      domain: data.domain ?? null,
      theme: data.theme ?? null,
      appTheme: data.appTheme ?? null,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors de la récupération du tenant" });
  }
});

describe('GET /api/tenant-public', () => {
  beforeEach(() => {
    mockDocGet.mockReset();
    mockCollectionGet.mockReset();
  });

  it('400 si ni domain ni id ne sont fournis', async () => {
    const response = await request(app).get('/api/tenant-public');
    expect(response.status).toBe(400);
  });

  it('404 si le tenant est introuvable par id', async () => {
    mockDocGet.mockResolvedValue({ exists: false });
    const response = await request(app).get('/api/tenant-public?id=inconnu');
    expect(response.status).toBe(404);
  });

  it('404 si aucun tenant ne correspond au domaine', async () => {
    mockCollectionGet.mockResolvedValue({ empty: true, docs: [] });
    const response = await request(app).get('/api/tenant-public?domain=inconnu.example.com');
    expect(response.status).toBe(404);
  });

  it('200 par id, avec uniquement la projection publique (aucun champ sensible)', async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      id: 'tenant-a',
      data: () => ({
        name: 'Tenant A',
        plan: 'premium',
        domain: 'tenant-a.example.com',
        theme: { primary: '#fff' },
        appTheme: { mode: 'dark' },
        secrets: { apiKey: 'ne-doit-jamais-fuiter' },
        members: ['user1'],
      }),
    });

    const response = await request(app).get('/api/tenant-public?id=tenant-a');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 'tenant-a',
      name: 'Tenant A',
      plan: 'premium',
      domain: 'tenant-a.example.com',
      theme: { primary: '#fff' },
      appTheme: { mode: 'dark' },
    });
    expect(response.body.secrets).toBeUndefined();
    expect(response.body.members).toBeUndefined();
  });

  it('200 par domaine (recherche via query Firestore)', async () => {
    mockCollectionGet.mockResolvedValue({
      empty: false,
      docs: [{ id: 'tenant-b', exists: true, data: () => ({ name: 'Tenant B', domain: 'tenant-b.example.com' }) }],
    });

    const response = await request(app).get('/api/tenant-public?domain=tenant-b.example.com');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe('tenant-b');
    expect(response.body.name).toBe('Tenant B');
  });
});
