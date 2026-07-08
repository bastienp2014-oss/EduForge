import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ragIngestLimiter } from './src/middlewares/rateLimit.middleware';

vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
  FieldValue: { serverTimestamp: vi.fn() },
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockImplementation(async (token) => {
      if (token === 'valid-learner-token') return { uid: 'u1', role: 'learner', tenantId: 't1' };
      if (token === 'valid-creator-token') return { uid: 'u2', role: 'creator', tenantId: 't1' };
      if (token === 'valid-admin-token') return { uid: 'u3', role: 'admin', tenantId: 't1' };
      if (token === 'valid-superadmin-token') return { uid: 'u4', role: 'superadmin', tenantId: 't1' };
      throw new Error('Invalid token');
    }),
  })),
}));

// We recreate the route setup as in server.ts to test the middlewares
const app = express();

app.use((req, res, next) => {
  if (req.path === '/api/gemini/rag-ingest') {
    express.json({ limit: '10mb' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

const requireAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé: Token manquant' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Non autorisé: Token invalide' });
  }
};

const requireAppCheck = (req: any, res: any, next: any) => next(); // Mocked out
const geminiLimiter = (req: any, res: any, next: any) => next(); // Mocked out for simplicity

app.post("/api/gemini/rag-ingest", requireAppCheck, requireAuth, geminiLimiter, ragIngestLimiter, async (req: any, res: any) => {
  try {
    const caller = req.user;
    const tenantId = caller?.tenantId;

    const isSuperAdmin = caller?.role === 'superadmin';
    const isTenantAdmin = caller?.tenantId === tenantId && ['admin', 'creator'].includes(caller?.role);

    if (!isSuperAdmin && !isTenantAdmin) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const { courseId, text } = req.body;

    if (!courseId || !text) {
      return res.status(400).json({ error: "courseId et text sont requis" });
    }

    // Mock successful response
    res.json({ success: true, ingested: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
});

describe('RAG Ingestion Guards', () => {

  beforeEach(() => {
    // Reset rate limiter hits between tests is not trivial without a store,
    // but we can generate a new tenant ID for the quota test to avoid conflicts.
  });

  it('rejects payload > 10MB with 413', async () => {
    const elevenMbString = 'a'.repeat(11 * 1024 * 1024);
    const response = await request(app)
      .post('/api/gemini/rag-ingest')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ courseId: 'c1', text: elevenMbString });

    expect(response.status).toBe(413);
  });

  it('rejects roles other than admin/creator with 403', async () => {
    const response = await request(app)
      .post('/api/gemini/rag-ingest')
      .set('Authorization', 'Bearer valid-learner-token')
      .send({ courseId: 'c1', text: 'hello' });

    expect(response.status).toBe(403);
  });

  it('allows admin role under quota with 200', async () => {
    const response = await request(app)
      .post('/api/gemini/rag-ingest')
      .set('Authorization', 'Bearer valid-admin-token')
      .send({ courseId: 'c1', text: 'hello proxy de rétention' }); // Using term semantics as instructed

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

  it('rejects the 21st request from the same tenant in the hour with 429', async () => {
    // We send 20 requests with a new tenant to ensure clean slate
    const app2 = express();
    app2.use((req, res, next) => {
      if (req.path === '/api/gemini/rag-ingest') {
        express.json({ limit: '10mb' })(req, res, next);
      } else {
        express.json()(req, res, next);
      }
    });

    // Use the specific rate limiter
    app2.post("/api/gemini/rag-ingest", requireAuth, ragIngestLimiter, (req: any, res: any) => {
      res.json({ success: true });
    });

    // Mock auth for a specific tenant test
    vi.mocked((await import('firebase-admin/auth')).getAuth).mockImplementation(() => ({
      verifyIdToken: vi.fn().mockImplementation(async () => {
         return { uid: 'u_quota', role: 'admin', tenantId: 't_quota' };
      })
    }) as any);

    // Send 20 successful requests
    for (let i = 0; i < 20; i++) {
      const response = await request(app2)
        .post('/api/gemini/rag-ingest')
        .set('Authorization', 'Bearer some-token')
        .send({ courseId: 'c1', text: 'test' });

      expect(response.status).toBe(200);
    }

    // 21st request should be rate-limited
    const finalResponse = await request(app2)
      .post('/api/gemini/rag-ingest')
      .set('Authorization', 'Bearer some-token')
      .send({ courseId: 'c1', text: 'test' });

    expect(finalResponse.status).toBe(429);
    expect(finalResponse.body.error).toBe("Quota d'ingestion RAG dépassé pour ce tenant.");
  });
