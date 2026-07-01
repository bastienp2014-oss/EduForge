import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import * as pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAppCheck } from 'firebase-admin/app-check';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { calculateRevenueSplits } from './src/utils/revenue';
import { ingestDocument, retrieveChunks, clearCourseIndex } from './src/server/rag';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, 
    // Set sampling rate for profiling
    profilesSampleRate: 1.0,
  });
}

try {
  if (!getApps().length) {
    initializeApp();
  }
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Firebase App Check middleware
const requireAppCheck = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const appCheckToken = req.header('X-Firebase-AppCheck');

  if (!appCheckToken) {
    return res.status(401).json({ error: 'Non autorisé: Token App Check manquant' });
  }

  try {
    const appCheckClaims = await getAppCheck().verifyToken(appCheckToken);
    // If verifyToken() succeeds, the request is allowed to proceed
    next();
  } catch (err) {
    console.error('Erreur de vérification App Check:', err);
    return res.status(401).json({ error: 'Non autorisé: Token App Check invalide' });
  }
};

// Authentication middleware
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Rate limiting middlewares
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Quota Gemini dépassé pour le moment.' }
});

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  app.use(express.json());
  
  // Appliquer le limiteur global aux APIs
  app.use('/api/', apiLimiter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/admin/bootstrap", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (user.email === 'bastienp2014@gmail.com') {
        await getAuth().setCustomUserClaims(user.uid, { role: 'superadmin', tenantId: 'eduforge' });
        res.json({ success: true, message: "SuperAdmin claims granted. Please sign out and sign in again." });
      } else {
        res.status(403).json({ error: "Non autorisé" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur bootstrap" });
    }
  });

  app.post("/api/admin/members/invite", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const { email, role, tenantId, name } = req.body;
      
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && ['admin', 'owner'].includes(caller.role);
      
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé à inviter pour ce tenant" });
      }

      let targetUser;
      try {
        targetUser = await getAuth().getUserByEmail(email);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          targetUser = await getAuth().createUser({
            email,
            displayName: name,
            password: Math.random().toString(36).slice(-8) + 'A1!'
          });
        } else {
          throw e;
        }
      }

      await getAuth().setCustomUserClaims(targetUser.uid, { tenantId, role });

      const db = getFirestore();
      await db.collection('tenants').doc(tenantId).collection('members').doc(targetUser.uid).set({
        email,
        name: name || targetUser.displayName || '',
        role,
        joinedAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true, uid: targetUser.uid });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'invitation" });
    }
  });

  app.post("/api/admin/members/remove", requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const { uid, tenantId } = req.body;
      
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && ['admin', 'owner'].includes(caller.role);
      
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      await getAuth().setCustomUserClaims(uid, null);
      const db = getFirestore();
      await db.collection('tenants').doc(tenantId).collection('members').doc(uid).delete();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  app.post("/api/economy/update", requireAuth, async (req, res) => {
    try {
      const { piasses, xp } = req.body;
      const userId = (req as any).user.uid;
      
      const db = getFirestore();
      const userRef = db.collection('utilisateurs').doc(userId);
      const rankingRef = db.collection('classement').doc(userId);
      
      const updateData: any = {};
      if (typeof piasses === 'number') updateData.piasses = FieldValue.increment(piasses);
      if (typeof xp === 'number') {
        updateData.xp = FieldValue.increment(xp);
        updateData.scoreTotal = FieldValue.increment(xp);
      }
      
      if (Object.keys(updateData).length > 0) {
        updateData.derniereMiseAJour = FieldValue.serverTimestamp();
        await userRef.set(updateData, { merge: true });
        if (typeof xp === 'number') {
            await rankingRef.set({ scoreTotal: FieldValue.increment(xp), derniereMiseAJour: FieldValue.serverTimestamp() }, { merge: true });
        }
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la mise à jour économique" });
    }
  });

  app.get("/api/revenue/ledgers", requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const tenantId = req.query.tenantId as string;
      const db = getFirestore();
      
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && caller.role === 'admin';
      const isAdmin = isSuperAdmin || isTenantAdmin;
      
      let snapshot;
      if (isAdmin) {
        snapshot = await db.collection('ledgers').where('tenantId', '==', tenantId).get();
      } else {
        // Enforce tenantId on the query and match caller uid
        if (caller.tenantId !== tenantId) {
          return res.status(403).json({ error: "Non autorisé" });
        }
        snapshot = await db.collection('ledgers')
          .where('tenantId', '==', tenantId)
          .where('creatorId', '==', caller.uid)
          .get();
      }
      
      const ledgers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(ledgers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lecture ledgers" });
    }
  });

  app.get("/api/revenue/transactions", requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const tenantId = req.query.tenantId as string;
      const db = getFirestore();
      
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && caller.role === 'admin';
      const isAdmin = isSuperAdmin || isTenantAdmin;
      
      let query = db.collection('transactions').where('tenantId', '==', tenantId);
      
      if (!isAdmin) {
        if (caller.tenantId !== tenantId) {
          return res.status(403).json({ error: "Non autorisé" });
        }
        query = query.where('creatorId', '==', caller.uid);
      }
      
      const snapshot = await query.get();
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid requiring a composite index in Firestore
      transactions.sort((a: any, b: any) => {
        const timeA = a.timestamp?._seconds || 0;
        const timeB = b.timestamp?._seconds || 0;
        return timeB - timeA;
      });
      
      res.json(transactions.slice(0, 100));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lecture transactions" });
    }
  });

  app.post("/api/revenue/process-transaction", requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const { amount, creatorId, tenantId, type } = req.body;

      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && caller.role === 'admin';
      const isAdmin = isSuperAdmin || isTenantAdmin;
      
      if (!isAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      if (!amount || !creatorId || !tenantId) {
         return res.status(400).json({ error: "Paramètres manquants" });
      }

      const db = getFirestore();
      
      // Calculate revenue splits using utility
      const { platformPercentage, creatorPercentage, platformAmount, creatorAmount } = calculateRevenueSplits(amount, 30);

      const ledgerRef = db.collection('ledgers').doc(`${tenantId}_${creatorId}`);
      const txRef = db.collection('transactions').doc();

      // Atomic update
      await db.runTransaction(async (transaction) => {
        const ledgerDoc = await transaction.get(ledgerRef);
        
        const txData = {
          amount,
          type: type || 'sale',
          creatorId,
          tenantId,
          splits: { platformPercentage, creatorPercentage, platformAmount, creatorAmount },
          timestamp: FieldValue.serverTimestamp()
        };
        transaction.set(txRef, txData);

        if (!ledgerDoc.exists) {
          transaction.set(ledgerRef, {
            creatorId,
            tenantId,
            pendingBalance: creatorAmount,
            totalEarned: creatorAmount,
            lastUpdated: FieldValue.serverTimestamp()
          });
        } else {
          transaction.update(ledgerRef, {
            pendingBalance: FieldValue.increment(creatorAmount),
            totalEarned: FieldValue.increment(creatorAmount),
            lastUpdated: FieldValue.serverTimestamp()
          });
        }
      });

      res.json({ success: true, transactionId: txRef.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors du traitement de la transaction" });
    }
  });

  app.post("/api/gemini/generate-scenario", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { prompt, count, subject, persona, context } = req.body;
      
      const systemInstruction = (persona || "Tu es un expert.") + (context ? `\n\nContexte: ${context}` : "");
      
      const scenarioSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            titre: { type: Type.STRING },
            description: { type: Type.STRING },
            lieu: { type: Type.STRING },
            rue_id: { type: Type.STRING },
            statut: { type: Type.STRING },
            categorie: { type: Type.STRING },
            niveauMin: { type: Type.NUMBER },
            planRequis: { type: Type.STRING },
            noeudInitial: { type: Type.STRING },
            noeuds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  locuteur: { type: Type.STRING },
                  avatar: { type: Type.STRING },
                  texte: { type: Type.STRING },
                  audioUrl: { type: Type.STRING },
                  choix: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        texte: { type: Type.STRING },
                        noeudSuivant: { type: Type.STRING },
                        effets: {
                          type: Type.OBJECT,
                          properties: {
                            piasses: { type: Type.NUMBER },
                            xp: { type: Type.NUMBER },
                          }
                        },
                        feedback: { type: Type.STRING },
                      }
                    }
                  },
                  outcome: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      message: { type: Type.STRING },
                      sousTitre: { type: Type.STRING },
                      recompense: { type: Type.NUMBER },
                    }
                  }
                }
              }
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Génère ${count || 1} scénarios d'apprentissage du français québécois sur la thématique: "${subject}". ${prompt ? 'Instructions supplémentaires: ' + prompt : ''} 
Veille à utiliser les expressions québécoises. Statut par défaut: brouillon.
Format de retour strict JSON.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: scenarioSchema,
        },
      });

      let jsonStr = response.text?.trim() || '[]';
      let scenarios = JSON.parse(jsonStr);
      res.json(scenarios);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération avec Gemini" });
    }
  });

  app.post("/api/gemini/generate-image", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { prompt, aspectRatio, imageReference } = req.body;
      
      const contents = [];
      if (imageReference) {
        // Assume data:image/png;base64,... format
        const [meta, data] = imageReference.split(',');
        const mimeType = meta.match(/data:(.*?);/)?.[1] || 'image/png';
        contents.push({
          inlineData: { data, mimeType }
        });
      }
      contents.push({ text: prompt });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: { parts: contents },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "16:9",
          }
        }
      });

      let base64Image = null;
      let mimeType = "image/png";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          mimeType = part.inlineData.mimeType || mimeType;
          break;
        }
      }

      if (!base64Image) {
        throw new Error("No image generated");
      }

      res.json({ base64: base64Image, mimeType: mimeType });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération avec Gemini", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-marketing", requireAuth, geminiLimiter, async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Clé API Gemini non configurée." });
      }

      const { productName, productType, description, targetAudience, tone } = req.body;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `
En tant qu'expert en copywriting et marketing digital, crée une page de vente (landing page) optimisée pour la conversion.

Produit: ${productName}
Type: ${productType === 'bundle' ? 'Pack de cours' : 'Cours en ligne'}
Description initiale: ${description}
Cible: ${targetAudience || 'Apprenants souhaitant se perfectionner'}
Ton: ${tone || 'Professionnel, engageant, orienté résultat'}

Génère une réponse au format JSON contenant:
- headline: Un titre d'accroche puissant
- subheadline: Un sous-titre explicatif
- benefits: Un tableau de 3 à 5 bénéfices clés (chaque bénéfice ayant un titre et une description)
- targetAudience: À qui s'adresse ce produit spécifiquement
- salesPitch: Le texte principal de vente (markdown supporté)
- callToAction: Le texte du bouton principal (ex: "Commencer maintenant")
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subheadline: { type: Type.STRING },
              benefits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              targetAudience: { type: Type.STRING },
              salesPitch: { type: Type.STRING },
              callToAction: { type: Type.STRING }
            },
            required: ["headline", "subheadline", "benefits", "targetAudience", "salesPitch", "callToAction"]
          }
        }
      });

      if (!response.text) throw new Error("No response text");

      const data = JSON.parse(response.text);
      res.json(data);
    } catch (err: any) {
      console.error("Erreur Gemini Generate Marketing:", err);
      res.status(500).json({ error: "Erreur lors de la génération." });
    }
  });

  app.post("/api/gemini/generate-json", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { prompt, schema, persona, context } = req.body;
      
      const systemInstruction = (persona || "Tu es un expert.") + (context ? `\n\nContexte: ${context}` : "");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération avec Gemini", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/chat", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { history, message, persona, context } = req.body;
      
      const systemInstruction = (persona || "Tu es un tuteur amical et encourageant.") + (context ? `\n\nContexte: ${context}` : "") + "\n\nRéponds de manière concise, directe et adaptée au contexte du jeu en cours.";

      // map history from { role: 'user' | 'model', parts: [{text: string}] } format
      const formattedHistory = (history || []).map((h: any) => ({
        role: h.role,
        parts: h.parts || [{ text: h.text }]
      }));

      // if no history we use generateContent, if history we use chats (wait, the SDK supports passing history)
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: formattedHistory,
        config: {
          systemInstruction,
        }
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors du chat avec Gemini", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/rag-ingest", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const { courseId, text, clearPrevious } = req.body;
      
      if (!courseId || !text) {
        return res.status(400).json({ error: "courseId et text sont requis" });
      }

      if (clearPrevious) {
        clearCourseIndex(courseId);
      }

      const result = await ingestDocument(ai, courseId, text);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'ingestion RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-lesson-rag", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const { courseId, subject, prompt, persona } = req.body;
      if (!courseId || !subject) {
         return res.status(400).json({ error: "courseId et subject sont requis" });
      }

      // Retrieval: get top 5 relevant chunks for the subject/prompt
      const query = `${subject} ${prompt || ''}`;
      const relevantChunks = await retrieveChunks(ai, courseId, query, 5);
      
      const contextText = relevantChunks.map((c, i) => `[Source ${i+1}]: ${c.text}`).join("\n\n");
      
      const systemInstruction = 
        (persona || "Tu es un expert pédagogique.") + 
        "\n\nDIRECTIVE STRICTE DE ZERO-HALLUCINATION : Tu dois répondre UNIQUEMENT à partir du contexte fourni ci-dessous. Ne rajoute pas d'informations externes.\n\n" +
        (contextText ? `CONTEXTE DE REFERENCE:\n${contextText}` : "Aucun contexte spécifique trouvé.");
        
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Rédige une leçon structurée sur le sujet suivant: "${subject}". ${prompt ? 'Instructions supplémentaires: ' + prompt : ''}`,
        config: {
          systemInstruction,
        },
      });

      res.json({ 
        lesson: response.text, 
        sources: relevantChunks.length 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de leçon RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-json-rag", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const { courseId, prompt, persona, context, schema } = req.body;
      if (!courseId) {
         return res.status(400).json({ error: "courseId est requis" });
      }

      const query = `${prompt || ''} ${context || ''}`;
      const relevantChunks = await retrieveChunks(ai, courseId, query, 5);
      
      const contextText = relevantChunks.map((c, i) => `[Source ${i+1}]: ${c.text}`).join("\n\n");
      
      const systemInstruction = 
        (persona || "Tu es un expert pédagogique.") + 
        (context ? `\n\nContexte global: ${context}` : "") +
        "\n\nDIRECTIVE STRICTE DE ZERO-HALLUCINATION : Tu dois générer la configuration UNIQUEMENT à partir du contexte fourni ci-dessous. Ne rajoute pas d'informations externes.\n\n" +
        (contextText ? `CONTEXTE DE REFERENCE (RAG):\n${contextText}` : "Aucun document de référence trouvé dans le RAG.");
        
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de jeu RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-scaffold-rag", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const { courseId, prompt, persona, context } = req.body;
      if (!courseId) {
         return res.status(400).json({ error: "courseId est requis" });
      }

      // Retrieval: get top 8 relevant chunks for the prompt
      const query = `${prompt || ''} ${context || ''}`;
      const relevantChunks = await retrieveChunks(ai, courseId, query, 8);
      
      const contextText = relevantChunks.map((c, i) => `[Source ${i+1}]: ${c.text}`).join("\n\n");
      
      const systemInstruction = 
        (persona || "Tu es un expert pédagogique.") + 
        (context ? `\n\nContexte global: ${context}` : "") +
        "\n\nDIRECTIVE STRICTE DE ZERO-HALLUCINATION : Tu dois générer l'architecture UNIQUEMENT à partir du contexte fourni ci-dessous. Ne rajoute pas d'informations externes.\nTu dois générer un slogan accrocheur, une description marketing de l'application et un dictionnaire de vocabulaire éducatif initial extrait du contexte.\n\n" +
        (contextText ? `CONTEXTE DE REFERENCE (RAG):\n${contextText}` : "Aucun document de référence trouvé dans le RAG.");

      const schema = {
        type: Type.OBJECT,
        properties: {
          appName: { type: Type.STRING },
          appDescription: { type: Type.STRING },
          marketingSlogan: { type: Type.STRING },
          colors: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING },
              accent: { type: Type.STRING },
              bg: { type: Type.STRING },
              surface: { type: Type.STRING },
              ink: { type: Type.STRING },
              muted: { type: Type.STRING }
            },
            required: ["primary", "accent", "bg", "surface", "ink", "muted"]
          },
          parcours: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nom: { type: Type.STRING },
                description: { type: Type.STRING },
                lecons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nom: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["nom", "description"]
                  }
                }
              },
              required: ["nom", "description", "lecons"]
            }
          },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                mot: { type: Type.STRING },
                definition: { type: Type.STRING },
                exemple: { type: Type.STRING }
              },
              required: ["id", "mot", "definition", "exemple"]
            }
          }
        },
        required: ["appName", "appDescription", "marketingSlogan", "colors", "parcours", "vocabulary"]
      };
        
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Génère l'architecture de l'application selon les instructions : "${prompt}".`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de scaffold RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-items-rag", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const { courseId, prompt, count, schema, analysisSchema } = req.body;
      if (!courseId) {
         return res.status(400).json({ error: "courseId est requis" });
      }

      const query = prompt || '';
      const relevantChunks = await retrieveChunks(ai, courseId, query, 8);
      
      const contextText = relevantChunks.map((c, i) => `[Source ${i+1}]: ${c.text}`).join("\n\n");
      
      const systemInstruction = 
        "Tu es un expert pédagogique.\n\n" +
        "DIRECTIVE STRICTE DE ZERO-HALLUCINATION : Tu dois générer le contenu UNIQUEMENT à partir du contexte fourni ci-dessous. Ne rajoute pas d'informations externes.\n\n" +
        (contextText ? `CONTEXTE DE REFERENCE (RAG):\n${contextText}` : "Aucun document de référence trouvé dans le RAG.");

      const combinedSchema = {
        type: "OBJECT",
        properties: {
          items: { 
            type: "ARRAY", 
            items: schema || { type: "OBJECT" }
          },
          analysis: analysisSchema || { type: "OBJECT" }
        },
        required: ["items", "analysis"]
      };
        
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: combinedSchema,
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération d'items RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/suggest-mechanic", requireAuth, geminiLimiter, async (req, res) => {
    try {
      const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: apiKey as string,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const { subject, description } = req.body;
      if (!subject || !description) {
         return res.status(400).json({ error: "subject et description sont requis" });
      }

      const systemInstruction = 
        "Tu es un Game Designer IA expert en pédagogie. " +
        "Analyse le sujet et la description de la leçon pour choisir LA mécanique de jeu la plus pertinente parmi cette liste stricte : [\"quiz\", \"flashcard\", \"drag_drop\", \"fill_in_the_blank\", \"memory\"].";

      const schema = {
        type: Type.OBJECT,
        properties: {
          mechanic: { 
            type: Type.STRING,
            enum: ["quiz", "flashcard", "drag_drop", "fill_in_the_blank", "memory"],
            description: "La mécanique de jeu choisie"
          },
          reason: { 
            type: Type.STRING,
            description: "Une courte explication d'une phrase expliquant pourquoi cette mécanique est pédagogiquement adaptée."
          }
        },
        required: ["mechanic", "reason"]
      };

      const prompt = `Sujet : ${subject}\nDescription : ${description}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      let jsonStr = response.text?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la suggestion de mécanique", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/parse-document", requireAuth, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }

      const mimeType = file.mimetype;
      const ext = path.extname(file.originalname).toLowerCase();
      let text = "";

      if (mimeType === "application/pdf" || ext === ".pdf") {
        const data = await pdfParse.PDFParse(file.buffer);
        text = data.text;
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        ext === ".docx"
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
      } else if (mimeType.startsWith("text/") || ext === ".txt" || ext === ".md") {
        text = file.buffer.toString("utf8");
      } else {
        return res.status(400).json({ error: "Format de fichier non supporté. Veuillez utiliser PDF, DOCX, TXT ou MD." });
      }

      res.json({ text: text.trim() });
    } catch (err) {
      console.error("Erreur de parsing:", err);
      res.status(500).json({ error: "Erreur lors de l'analyse du document" });
    }
  });

  // Vite middleware for development
  app.post("/api/debug/error", express.json(), (req, res) => {
    console.error("CLIENT-SIDE ERROR: " + JSON.stringify(req.body));
    fs.appendFileSync("client_errors.log", JSON.stringify(req.body) + "\n");
    res.send("ok");
  });

  // Setup Sentry error handler
  Sentry.setupExpressErrorHandler(app);

  app.get("/api/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
