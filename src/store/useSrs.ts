/**
* STORE SRS — Mots & Blocs
*
* Persistance Firestore des cartes SRS par utilisateur.
* Sous-collection : utilisateurs/{uid}/srs/{itemId}
*/
import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  createSrsCard,
  scheduleNext,
  selectDailySession,
  xpForRating,
  type SrsCard,
  Rating,
} from '../services/srs';
import { contentProvider } from '../services/contentProvider';
import { useProgression } from './useProgression';
import { useAppConfig } from './useAppConfig';
import { COMPATIBILITY_MATRIX, MechanicId } from '../types';

// ─── Types ──────────────────────────────────────────────────────
interface SrsState {
  cards: Record<string, SrsCard>; // itemId → SrsCard
  sessionItemIds: string[];       // IDs de la session en cours
  recentFailures: string[];       // IDs des items échoués récemment (pour le Tuteur IA)
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Actions
  chargerDepuisFirebase: () => Promise<void>;
  preparerSession: (options?: { maxItems?: number; maxNouveaux?: number; tags?: string[]; mechanic?: string }) => void;
  enregistrerReponse: (itemId: string, rating: Rating) => Promise<void>;
  getSessionCards: () => SrsCard[];
  getNombreItemsDus: () => number;
}

// ─── Store ──────────────────────────────────────────────────────
export const useSrs = create<SrsState>((set, get) => ({
  cards: {},
  sessionItemIds: [],
  recentFailures: [],
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,

  // ── Charger toutes les cartes SRS depuis Firestore ───────────
  chargerDepuisFirebase: async () => {
    const user = auth.currentUser;
    if (!user) return;

    set({ isLoading: true });
    try {
      const srsRef = collection(db, 'utilisateurs', user.uid, 'srs');
      const snap = await getDocs(srsRef);
      const cards: Record<string, SrsCard> = {};
      
      snap.forEach((d) => {
        cards[d.id] = d.data() as SrsCard;
      });
      
      set({ cards, isLoading: false, lastSyncedAt: new Date().toISOString() });
    } catch (err) {
      console.error('[SRS] Erreur chargement Firestore:', err);
      set({ isLoading: false });
    }
  },

  // ── Préparer la session du jour ───────────────────────────────
  preparerSession: (options?: { maxItems?: number; maxNouveaux?: number; tags?: string[]; mechanic?: string }) => {
    const { cards } = get();
    const niveau = useProgression.getState().getNiveau();
    const { srsConfig } = useAppConfig.getState();
    
    // Tous les items accessibles à ce niveau
    let allItems = contentProvider.getItemsByNiveau(niveau);

    // Filtrer par tags si demandé
    if (options?.tags && options.tags.length > 0) {
      allItems = allItems.filter(i => {
        const itemTags = (i as any).tags || [];
        return options.tags!.some(t => itemTags.includes(t));
      });
    }
    
    // Filtrer par mécanique si demandé
    if (options?.mechanic) {
      const mechanicDef = COMPATIBILITY_MATRIX[options.mechanic as MechanicId];
      if (mechanicDef) {
        allItems = allItems.filter(i => mechanicDef.isCompatible(i as any));
      }
    }

    const allItemIds = allItems.map((i) => i.id);
    
    const isPrem = useProgression.getState().isPremium ||
                   useProgression.getState().subscriptionPlan === 'premium';
                   
    // Sélection intelligente (dus + nouveaux)
    const maxItemsParam = options?.maxItems || (isPrem ? srsConfig.maxDailyItems : Math.min(srsConfig.maxDailyItems, 5));
    const maxNouveauxParam = options?.maxNouveaux || srsConfig.maxNewItems;

    const sessionIds = selectDailySession(Object.values(cards), allItemIds, {
      maxItems: maxItemsParam,
      maxNouveaux: maxNouveauxParam,
    });
    
    const sessionIdsFinal = sessionIds.slice(0, maxItemsParam);
    set({ sessionItemIds: sessionIdsFinal });
  },

  // ── Enregistrer une réponse et persister ─────────────────────
  enregistrerReponse: async (itemId: string, rating: Rating) => {
    const user = auth.currentUser;
    const { cards } = get();

    // Créer la carte si elle n'existe pas encore (nouvel item)
    const niveau = useProgression.getState().getNiveau();
    const allItems = contentProvider.getItemsByNiveau(niveau);
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    const existingCard = cards[itemId] ?? createSrsCard(itemId, item.module);
    const { updatedCard } = scheduleNext(existingCard, rating);

    // Mise à jour locale immédiate
    set((state) => {
      const isFail = rating === Rating.Again;
      let newRecentFailures = [...state.recentFailures];
      if (isFail && !newRecentFailures.includes(itemId)) {
        newRecentFailures.push(itemId);
      } else if (!isFail) {
        newRecentFailures = newRecentFailures.filter(id => id !== itemId);
      }

      return {
        cards: { ...state.cards, [itemId]: updatedCard },
        recentFailures: newRecentFailures
      };
    });

    // XP selon la qualité de la réponse
    const routineBase = useProgression.getState().getPointsConfig().routineBase;
    const xp = xpForRating(rating, routineBase);
    
    if (xp > 0) {
      useProgression.getState().addXp(xp);
    }

    // Persistance Firestore (sans bloquer l'UI)
    if (user) {
      try {
        const cardRef = doc(db, 'utilisateurs', user.uid, 'srs', itemId);
        await setDoc(cardRef, updatedCard);
      } catch (err) {
        console.error('[SRS] Erreur sauvegarde carte:', err);
      }
    }
  },

  // ── Getter : cartes de la session en cours ───────────────────
  getSessionCards: () => {
    const { cards, sessionItemIds } = get();
    const niveau = useProgression.getState().getNiveau();
    const allItems = contentProvider.getItemsByNiveau(niveau);
    const itemMap = Object.fromEntries(allItems.map((i) => [i.id, i]));
    
    return sessionItemIds
      .filter((id) => itemMap[id]) // sécurité si item supprimé
      .map((id) => cards[id] ?? createSrsCard(id, itemMap[id].module));
  },

  // ── Getter : nombre d'items dus aujourd'hui ──────────────────
  getNombreItemsDus: () => {
    const { cards } = get();
    const now = new Date();
    return Object.values(cards).filter(
      (c) => new Date(c.due) <= now
    ).length;
  },
}));
