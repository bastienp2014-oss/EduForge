import express from 'express';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';

// Firebase App Check middleware
export const requireAppCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');
  const enforce = process.env.APP_CHECK_ENFORCE === 'true';

  if (!appCheckToken) {
    console.warn(`[App Check Monitor] Token App Check manquant pour la requête ${req.method} ${req.path}`);
    if (enforce) {
      return res.status(401).json({ error: 'Non autorisé: Token App Check manquant' });
    }
    return next();
  }

  try {
    await getAppCheck().verifyToken(appCheckToken);
    next();
  } catch (err: any) {
    console.warn(`[App Check Monitor] Token App Check invalide pour la requête ${req.method} ${req.path}:`, err?.message || err);
    if (enforce) {
      return res.status(401).json({ error: 'Non autorisé: Token App Check invalide' });
    }
    next();
  }
};

// Authentication middleware
export const requireSuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  const token = req.body?.token;
  const isValidToken = process.env.SUPERADMIN_PROVISIONING_TOKEN && token === process.env.SUPERADMIN_PROVISIONING_TOKEN;

  if (isValidToken || (user && user.role === "superadmin")) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: Superadmin role required" });
};

export const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé: Token manquant' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return res.status(401).json({ error: 'Non autorisé: Token invalide' });
  }
};
