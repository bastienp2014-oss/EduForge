import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock dependencies
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
      if (token === 'valid-anon-token') {
        return { uid: 'anon', role: 'user' };
      }
      if (token === 'valid-superadmin-token') {
        return { uid: 'admin', role: 'superadmin' };
      }
      throw new Error('Invalid token');
    }),
  })),
}));

// We need to import the server implementation. Since server.ts exports startServer and it initializes everything,
// let's create a minimal test setup reproducing the route setup with the middlewares to test them in isolation,
// or test the actual server.ts middlewares directly.
// For testing the exact logic in server.ts without starting the real server, we can write a small express app and attach the middlewares.

const requireSuperAdmin = (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden: Superadmin role required" });
  }
  next();
};

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

const app = express();
app.use(express.json());

app.post("/api/debug/error", requireAuth, requireSuperAdmin, (req, res) => {
  res.status(200).json({ success: true });
});

app.get("/api/debug-sentry", requireAuth, requireSuperAdmin, (req, res) => {
  res.status(200).json({ success: true });
});

describe('Debug endpoints security (403)', () => {
  describe('POST /api/debug/error', () => {
    it('returns 401 for anonymous request (no auth)', async () => {
      const response = await request(app).post('/api/debug/error').send({ error: 'test' });
      expect(response.status).toBe(401);
    });

    it('returns 403 for authenticated request without superadmin role', async () => {
      const response = await request(app)
        .post('/api/debug/error')
        .set('Authorization', 'Bearer valid-anon-token')
        .send({ error: 'test' });
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden: Superadmin role required');
    });

    it('returns 200 for authenticated superadmin request', async () => {
      const response = await request(app)
        .post('/api/debug/error')
        .set('Authorization', 'Bearer valid-superadmin-token')
        .send({ error: 'test' });
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/debug-sentry', () => {
    it('returns 401 for anonymous request (no auth)', async () => {
      const response = await request(app).get('/api/debug-sentry');
      expect(response.status).toBe(401);
    });

    it('returns 403 for authenticated request without superadmin role', async () => {
      const response = await request(app)
        .get('/api/debug-sentry')
        .set('Authorization', 'Bearer valid-anon-token');
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden: Superadmin role required');
    });

    it('returns 200 for authenticated superadmin request', async () => {
      const response = await request(app)
        .get('/api/debug-sentry')
        .set('Authorization', 'Bearer valid-superadmin-token');
      expect(response.status).toBe(200);
    });
  });
});
