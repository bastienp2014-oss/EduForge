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
import firebaseConfig from './firebase-applet-config.json';
import { requireAppCheck, requireSuperAdmin, requireAuth } from './src/middlewares/auth.middleware';
import { apiLimiter, geminiLimiter, byokTestLimiter } from './src/middlewares/rateLimit.middleware';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { calculateRevenueSplits } from './src/utils/revenue';
import { ingestDocument, retrieveChunks, clearCourseIndex } from './src/server/rag';
import { routeGenerateContent, routeChat, getGoogleAIInstance, getTenantAIConfig, testAIConfig, encrypt, decrypt, type AIConfig } from './src/server/llmRouter';


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

async function startServer() {
  if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    console.error('FATAL: ENCRYPTION_KEY not set in production. Exiting.');
    process.exit(1);
  }

  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;


  // Conditionally apply express.json with different limits
  app.use((req, res, next) => {
    if (req.path === '/api/gemini/rag-ingest') {
      express.json({ limit: '10mb' })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });

  
  // Appliquer le limiteur global aux APIs
  app.use('/api/', apiLimiter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/admin/bootstrap", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      const user = (req as any).user;
      
      const isSuperAdmin = user.role === 'superadmin';
      const isValidToken = process.env.SUPERADMIN_PROVISIONING_TOKEN && token === process.env.SUPERADMIN_PROVISIONING_TOKEN;

      if (isSuperAdmin || isValidToken) {
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

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
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

  app.post("/api/admin/members/remove", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const { uid, tenantId } = req.body;
      
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = caller.tenantId === tenantId && ['admin', 'owner'].includes(caller.role);
      
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      await getAuth().setCustomUserClaims(uid, null);
      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      await db.collection('tenants').doc(tenantId).collection('members').doc(uid).delete();

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  const ACTIVITY_REWARDS: Record<string, { xp: number; piasses: number; validate?: (body: any) => { xp: number; piasses: number } }> = {
    quiz_correct: { xp: 1.25, piasses: 1.25 },
    swipe_correct: { xp: 0.50, piasses: 0.50 },
    blocs_correct: {
      xp: 0.25,
      piasses: 0.25,
      validate: (body) => {
        const qty = typeof body.quantity === 'number' && body.quantity > 0 ? body.quantity : 1;
        const cappedQty = Math.min(qty, 100);
        return { xp: cappedQty * 0.25, piasses: cappedQty * 0.25 };
      }
    },
    sort_correct: { xp: 1, piasses: 1 },
    hache_correct: { xp: 5, piasses: 5 },
    tu_correct: { xp: 5, piasses: 5 },
    contractions_correct: { xp: 5, piasses: 5 },
    tutoiement_correct: { xp: 5, piasses: 5 },
    game2048_correct: {
      xp: 2.25,
      piasses: 2.25,
      validate: (body) => {
        const qty = typeof body.quantity === 'number' && body.quantity > 0 ? body.quantity : 1;
        const cappedQty = Math.min(qty, 20);
        return { xp: cappedQty * 2.25, piasses: cappedQty * 2.25 };
      }
    },
    lesson_complete: {
      xp: 25,
      piasses: 10,
      validate: (body) => {
        const score = typeof body.score === 'number' && body.score >= 0 ? body.score : 0;
        const cappedScore = Math.min(score, 100);
        return {
          xp: 25 + cappedScore,
          piasses: 10 + Math.floor(cappedScore / 5)
        };
      }
    },
    theory_complete: { xp: 15, piasses: 5 },
    onboarding_complete: { xp: 100, piasses: 1000 },
    watch_ad: { xp: 10, piasses: 10 },
    srs_card_reviewed: {
      xp: 2,
      piasses: 0,
      validate: (body) => {
        const rating = typeof body.rating === 'number' ? body.rating : 3;
        const routineBase = 2;
        let xp = 0;
        if (rating === 1) xp = routineBase * 0.5;
        else if (rating === 2) xp = routineBase;
        else if (rating === 3) xp = routineBase * 1.5;
        else if (rating === 4) xp = routineBase * 2;
        return { xp, piasses: 0 };
      }
    },
    word_unlocked: { xp: 10, piasses: 0 },
    arcade_game_complete: {
      xp: 0,
      piasses: 0,
      validate: (body) => {
        const score = typeof body.score === 'number' && body.score > 0 ? body.score : 0;
        const cappedScore = Math.min(score, 100);
        return { xp: cappedScore, piasses: cappedScore };
      }
    },
    scenario_complete: {
      xp: 0,
      piasses: 0,
      validate: (body) => {
        const xp = typeof body.xp === 'number' ? body.xp : 0;
        const piasses = typeof body.piasses === 'number' ? body.piasses : 0;
        const cappedXp = Math.max(-500, Math.min(xp, 500));
        const cappedPiasses = Math.max(-1000, Math.min(piasses, 1000));
        return { xp: cappedXp, piasses: cappedPiasses };
      }
    }
  };

  app.post("/api/economy/update", requireAuth, async (req, res) => {
    try {
      const { piasses, xp } = req.body;
      const userId = (req as any).user.uid;
      
      // Verify that this endpoint is only used to spent money/debit (negative piasses)
      // Disallow any XP additions or positive piasses additions
      if (typeof xp === 'number' && xp > 0) {
        return res.status(400).json({ error: "L'XP ne peut pas être augmentée directement via cet endpoint." });
      }
      if (typeof piasses === 'number' && piasses > 0) {
        return res.status(400).json({ error: "Les gains de piasses doivent passer par /api/economy/claim-reward." });
      }

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
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

  app.post("/api/economy/claim-reward", requireAuth, async (req, res) => {
    try {
      const { activityId } = req.body;
      const userId = (req as any).user.uid;

      if (!activityId || !ACTIVITY_REWARDS[activityId]) {
        return res.status(400).json({ error: "Activité invalide ou non supportée" });
      }

      const rewardDef = ACTIVITY_REWARDS[activityId];
      let xpToAward = rewardDef.xp;
      let piassesToAward = rewardDef.piasses;

      if (rewardDef.validate) {
        const validated = rewardDef.validate(req.body);
        xpToAward = validated.xp;
        piassesToAward = validated.piasses;
      }

      // Rounded to 2 decimal places
      xpToAward = Math.round(xpToAward * 100) / 100;
      piassesToAward = Math.round(piassesToAward * 100) / 100;

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      const userRef = db.collection('utilisateurs').doc(userId);
      const rankingRef = db.collection('classement').doc(userId);

      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        let currentPiasses = 0;
        let currentXp = 0;

        if (userDoc.exists) {
          const data = userDoc.data() || {};
          currentPiasses = data.piasses || 0;
          currentXp = data.xp || 0;
        }

        const newPiasses = Math.max(0, Math.round((currentPiasses + piassesToAward) * 100) / 100);
        const newXp = Math.max(0, Math.round((currentXp + xpToAward) * 100) / 100);

        transaction.set(userRef, {
          piasses: newPiasses,
          xp: newXp,
          derniereMiseAJour: FieldValue.serverTimestamp()
        }, { merge: true });

        if (xpToAward > 0) {
          transaction.set(rankingRef, {
            scoreTotal: newXp,
            derniereMiseAJour: FieldValue.serverTimestamp()
          }, { merge: true });
        }

        return { totalPiasses: newPiasses, totalXp: newXp };
      });

      res.json({
        success: true,
        xpAdded: xpToAward,
        piassesAdded: piassesToAward,
        totalPiasses: result.totalPiasses,
        totalXp: result.totalXp
      });
    } catch (err) {
      console.error("Erreur lors de la réclamation:", err);
      res.status(500).json({ error: "Erreur lors de la réclamation de la récompense" });
    }
  });

  app.get("/api/revenue/ledgers", requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const tenantId = req.query.tenantId as string;
      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      
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
      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      
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

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      
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

  app.post("/api/gemini/generate-scenario", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
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

      const resultText = await routeGenerateContent(tenantId, {
        prompt: `Génère ${count || 1} scénarios d'apprentissage du français québécois sur la thématique: "${subject}". ${prompt ? 'Instructions supplémentaires: ' + prompt : ''} \nVeille à utiliser les expressions québécoises. Statut par défaut: brouillon.\nFormat de retour strict JSON.`,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
      });

      let jsonStr = resultText?.trim() || '[]';
      let scenarios = JSON.parse(jsonStr);
      res.json(scenarios);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de scénarios", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-image", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const ai = await getGoogleAIInstance(tenantId);
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
      res.status(500).json({ error: "Erreur lors de la génération d'image", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-marketing", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { productName, productType, description, targetAudience, tone } = req.body;

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

      const schema = {
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
      };

      const resultText = await routeGenerateContent(tenantId, {
        prompt,
        responseMimeType: "application/json",
        responseSchema: schema,
        modelOverride: "gemini-2.5-flash",
      });

      if (!resultText) throw new Error("No response text");

      const data = JSON.parse(resultText);
      res.json(data);
    } catch (err: any) {
      console.error("Erreur Generate Marketing:", err);
      res.status(500).json({ error: "Erreur lors de la génération." });
    }
  });

  app.post("/api/gemini/generate-json", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { prompt, schema, persona, context } = req.body;
      
      const systemInstruction = (persona || "Tu es un expert.") + (context ? `\n\nContexte: ${context}` : "");

      const resultText = await routeGenerateContent(tenantId, {
        prompt,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let jsonStr = resultText?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/chat", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { history, message, persona, context } = req.body;
      
      const systemInstruction = (persona || "Tu es un tuteur amical et encourageant.") + (context ? `\n\nContexte: ${context}` : "") + "\n\nRéponds de manière concise, directe et adaptée au contexte du jeu en cours.";

      const resultText = await routeChat(tenantId, {
        history: history || [],
        message,
        systemInstruction,
      });

      res.json({ text: resultText });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors du chat", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/rag-ingest", requireAppCheck, requireAuth, geminiLimiter, ragIngestLimiter, async (req, res) => {
    try {
      const caller = (req as any).user;
      const tenantId = caller?.tenantId;

      const isSuperAdmin = caller?.role === 'superadmin';
      const isTenantAdmin = caller?.tenantId === tenantId && ['admin', 'creator'].includes(caller?.role);

      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const ai = await getGoogleAIInstance(tenantId);
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

  app.post("/api/gemini/generate-lesson-rag", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const ai = await getGoogleAIInstance(tenantId);
      
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
        
      const responseText = await routeGenerateContent(tenantId, {
        prompt: `Rédige une leçon structurée sur le sujet suivant: "${subject}". ${prompt ? 'Instructions supplémentaires: ' + prompt : ''}`,
        systemInstruction,
      });

      res.json({ 
        lesson: responseText, 
        sources: relevantChunks.length 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de leçon RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-json-rag", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const ai = await getGoogleAIInstance(tenantId);
      
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
        
      const responseText = await routeGenerateContent(tenantId, {
        prompt,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let jsonStr = responseText?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de jeu RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-scaffold-rag", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const ai = await getGoogleAIInstance(tenantId);
      
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
        
      const responseText = await routeGenerateContent(tenantId, {
        prompt: `Génère l'architecture de l'application selon les instructions : "${prompt}".`,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let jsonStr = responseText?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération de scaffold RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/generate-items-rag", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const ai = await getGoogleAIInstance(tenantId);
      
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
        
      const responseText = await routeGenerateContent(tenantId, {
        prompt,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: combinedSchema,
      });

      let jsonStr = responseText?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la génération d'items RAG", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post("/api/gemini/suggest-mechanic", requireAppCheck, requireAuth, geminiLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
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

      const responseText = await routeGenerateContent(tenantId, {
        prompt,
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let jsonStr = responseText?.trim() || '{}';
      res.json(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la suggestion de mécanique", details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get("/api/gemini/test", requireAppCheck, requireAuth, byokTestLimiter, async (req, res) => {
    try {
      const tenantId = (req as any).user?.tenantId;
      const tenantConfig = tenantId ? await getTenantAIConfig(tenantId) : null;
      const effectiveConfig: AIConfig | null = tenantConfig || (process.env.GEMINI_API_KEY
        ? { provider: 'google', apiKey: process.env.GEMINI_API_KEY }
        : null);

      if (!effectiveConfig) {
        return res.status(500).json({ valid: false, reason: "Aucune clé API configurée (ni BYOK, ni clé système)" });
      }

      await testAIConfig(effectiveConfig);
      res.status(200).json({ valid: true, provider: effectiveConfig.provider });
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        return res.status(401).json({ valid: false, reason: "Clé API invalide" });
      }
      console.error('BYOK test error:', err);
      res.status(500).json({ valid: false, reason: "Erreur serveur lors du test de la clé" });
    }
  });

  // Endpoints administration BYOK
  app.get("/api/admin/byok/config", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = ['admin', 'owner'].includes(caller.role);
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }
      
      const targetTenantId = isSuperAdmin ? (req.query.tenantId as string) : caller.tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: "tenantId est requis" });
      }

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      const doc = await db.collection('tenants').doc(targetTenantId).collection('secrets').doc('ai_config').get();
      if (!doc.exists) {
        return res.json({ configured: false });
      }

      const data = doc.data();
      res.json({
        configured: true,
        provider: data?.provider,
        modelName: data?.modelName,
        apiKeyMasked: "••••••••••••••••"
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la récupération de la configuration BYOK" });
    }
  });

  app.post("/api/admin/byok/config", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = ['admin', 'owner'].includes(caller.role);
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const { provider, apiKey, modelName, tenantId } = req.body;
      const targetTenantId = isSuperAdmin ? tenantId : caller.tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: "tenantId est requis" });
      }
      if (!provider || !apiKey) {
        return res.status(400).json({ error: "provider et apiKey sont requis" });
      }
      if (!['google', 'openai', 'anthropic'].includes(provider)) {
        return res.status(400).json({ error: "Fournisseur non supporté" });
      }

      const encryptedApiKey = encrypt(apiKey);
      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      await db.collection('tenants').doc(targetTenantId).collection('secrets').doc('ai_config').set({
        provider,
        encryptedApiKey,
        modelName: modelName || null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: caller.uid
      });

      res.json({ success: true, message: "Configuration BYOK sauvegardée et chiffrée avec succès." });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de l'enregistrement de la configuration BYOK" });
    }
  });

  app.delete("/api/admin/byok/config", requireAppCheck, requireAuth, async (req, res) => {
    try {
      const caller = (req as any).user;
      const isSuperAdmin = caller.role === 'superadmin';
      const isTenantAdmin = ['admin', 'owner'].includes(caller.role);
      if (!isSuperAdmin && !isTenantAdmin) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const targetTenantId = isSuperAdmin ? (req.query.tenantId as string) : caller.tenantId;
      if (!targetTenantId) {
        return res.status(400).json({ error: "tenantId est requis" });
      }

      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      await db.collection('tenants').doc(targetTenantId).collection('secrets').doc('ai_config').delete();

      res.json({ success: true, message: "Configuration BYOK supprimée. Retour à la clé système par défaut." });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la suppression de la configuration BYOK" });
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

  app.post("/api/debug/error", requireAuth, requireSuperAdmin, (req, res) => {
    try {
      const bodyStr = JSON.stringify(req.body);
      
      // Limit payload size to 50KB to protect disk space
      if (bodyStr.length > 50 * 1024) {
        return res.status(400).json({ error: "Payload trop grand (max 50 Ko)" });
      }

      console.error("CLIENT-SIDE ERROR: " + bodyStr);

      const logPath = "client_errors.log";

      // Log rotation and maximum cumulative limit mechanism
      try {
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath);
          // If total log size exceeds 5MB, rotate it
          if (stats.size > 5 * 1024 * 1024) {
            const oldLogPath = logPath + ".old";
            if (fs.existsSync(oldLogPath)) {
              fs.unlinkSync(oldLogPath);
            }
            fs.renameSync(logPath, oldLogPath);
          }
        }
      } catch (rotationErr) {
        console.error("Erreur lors de la rotation des logs client:", rotationErr);
      }

      fs.appendFileSync(logPath, bodyStr + "\n");
      res.send("ok");
    } catch (err) {
      console.error("Erreur lors du traitement du rapport d'erreur:", err);
      res.status(500).json({ error: "Erreur interne" });
    }
  });

  // Setup Sentry error handler
  Sentry.setupExpressErrorHandler(app);

  app.get("/api/debug-sentry", requireAuth, requireSuperAdmin, function mainHandler(req, res) {
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
