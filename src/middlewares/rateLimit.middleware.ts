import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import express from 'express';

// Rate limiting middlewares
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

export const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Quota Gemini dépassé pour le moment.' }
});

export const byokTestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: { error: 'Un seul test de clé par minute.' },
  keyGenerator: (req: express.Request) => (req as any).user?.tenantId || ipKeyGenerator(req.ip as string)
});
