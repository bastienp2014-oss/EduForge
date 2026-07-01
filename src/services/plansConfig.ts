/**
 * PLANS CONFIG — Mots & Blocs
 *
 * ─────────────────────────────────────────────────────────────
 * Configuration dynamique des forfaits depuis Firestore.
 * Collection : /configuration/plans
 *
 * Multi-marque : chaque instance lit sa propre config via VITE_BRAND_ID.
 * Ex: VITE_BRAND_ID=fr_qc -> /configuration/plans_fr_qc
 *
 * Pour modifier les prix SANS redéployer :
 *   -> Firebase Console -> Firestore -> /configuration/plans -> Modifier
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useTenant } from '../store/useTenant';

// ─── Types ───────────────────────────────────────────────────

export interface PlanConfig {
  nom: string;
  emoji: string;
  couleur: string;
  prix_mensuel: number;
  prix_annuel: number;
  prix_lifetime: number;
  devise: string;
  avantages: string[];
  // Limites pour le plan gratuit
  srs_items_par_jour_gratuit: number;
  quiz_par_jour_gratuit: number;
  // Essai gratuit
  essai_jours: number;
}

export interface PlansConfig {
  premium: PlanConfig;
  meta: {
    marque: string;
    updated_at: string;
  };
}

// ─── Configuration par défaut ─────────────────────────────────
// Utilisée si Firestore est indisponible ou la collection vide

export const DEFAULT_PLANS_CONFIG: PlansConfig = {
  premium: {
    nom: 'Premium',
    emoji: '👑',
    couleur: '#8B5CF6',
    prix_mensuel: 14.99,
    prix_annuel: 69.99,
    prix_lifetime: 129.99,
    devise: 'CAD',
    avantages: [
      'SRS illimité — révisez sans limite quotidienne',
      'Simulateur SAAQ complet — évitez 150–250$ d\'échecs',
      'Simulateur Loi 31 — protégez-vous des arnaques de loyer',
      'Audio québécois natif — entendez la vraie prononciation',
      'Vitesse audio progressive (0.60x → 1.50x)',
      'Scénarios de Rue immersifs (bientôt)',
      'Badge Premium exclusif',
    ],
    srs_items_par_jour_gratuit: 5,
    quiz_par_jour_gratuit: 5,
    essai_jours: 7,
  },
  meta: {
    marque: import.meta.env.VITE_BRAND_ID ?? 'fr_qc',
    updated_at: new Date().toISOString(),
  },
};

// ─── ID du document Firestore ─────────────────────────────────

const BRAND_ID = import.meta.env.VITE_BRAND_ID ?? 'fr_qc';
const CONFIG_DOC_ID = `plans_${BRAND_ID}`;

// ─── Hook usePlansConfig ──────────────────────────────────────

export function usePlansConfig() {
  const [config, setConfig] = useState<PlansConfig>(DEFAULT_PLANS_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const { currentTenant } = useTenant();

  useEffect(() => {
    const load = async () => {
      try {
        const tenantId = currentTenant?.id || 'eduforge';
        const ref = doc(db, 'tenants', tenantId, 'configuration', CONFIG_DOC_ID);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
          setConfig(snap.data() as PlansConfig);
        } else {
          // Initialise la config par défaut dans Firestore si absente
          await setDoc(ref, DEFAULT_PLANS_CONFIG);
        }
      } catch (err) {
        console.warn('[PlansConfig] Firestore indisponible, utilisation des défauts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTenant?.id]);

  return { config, isLoading };
}

// ─── Sauvegarder la config depuis l'admin ─────────────────────

export async function savePlansConfig(config: PlansConfig, tenantId: string = 'eduforge'): Promise<void> {
  const ref = doc(db, 'tenants', tenantId, 'configuration', CONFIG_DOC_ID);
  await setDoc(ref, {
    ...config,
    meta: {
      ...config.meta,
      updated_at: new Date().toISOString(),
    },
  });
}
