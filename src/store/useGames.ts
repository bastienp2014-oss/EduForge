import { create } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

export type GameMechanic = string;

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  mechanic: GameMechanic;
  tags: string[]; // for filtering words
  enabled: boolean;
  data?: any; // Specific pedagogical content for this game instance
}

const DEFAULT_GAMES: GameConfig[] = [
  { id: 'flashcards', name: 'Cartes Éclairs', icon: '📇', description: 'Révise ton vocabulaire', mechanic: 'flashcard', tags: ['vocab'], enabled: true },
  { id: 'hache', name: 'La Hache', icon: '🪓', description: 'Trouvez le mot avant que l\'arbre ne tombe', mechanic: 'pendu', tags: ['pendu'], enabled: true },
  { id: 'quiz', name: 'Quiz Express', icon: '❓', description: 'Choix multiples rapides', mechanic: 'quiz', tags: ['quiz'], enabled: true },
  { id: 'sort', name: 'Le Tri', icon: '📦', description: 'Associez les mots', mechanic: 'swipe', tags: ['tri'], enabled: true },
  { id: 'swipe', name: 'Swipe', icon: '🃏', description: 'Vrai ou faux ?', mechanic: 'swipe', tags: ['swipe'], enabled: true },
];

interface GamesFields {
  games: GameConfig[];
}

interface GamesState extends GamesFields {
  isLoaded: boolean;
  load: (tenantId: string) => Promise<void>;
  addGame: (game: GameConfig) => void;
  updateGame: (id: string, updates: Partial<GameConfig>) => void;
  removeGame: (id: string) => void;
}

const DEFAULTS: GamesFields = {
  games: DEFAULT_GAMES,
};

const LEGACY_STORAGE_KEY = 'quebec-games';

function canWriteTenantConfig(): boolean {
  const role = useAuth.getState().claims?.role;
  return role === 'superadmin' || role === 'admin' || role === 'owner';
}

function readLegacyLocalStorage(): Partial<GamesFields> | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const legacy = parsed?.state;
    if (legacy && typeof legacy === 'object') return legacy as Partial<GamesFields>;
  } catch (e) {
    console.error('Lecture localStorage legacy games échouée:', e);
  }
  return null;
}

let loadedTenantId: string | null = null;

export const useGames = create<GamesState>()((set) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async (tenantId: string) => {
    loadedTenantId = tenantId;
    set({ ...DEFAULTS, isLoaded: false });

    const configRef = doc(db, 'tenants', tenantId, 'configuration', 'games');
    try {
      const snap = await getDoc(configRef);

      if (snap.exists()) {
        set({ ...DEFAULTS, ...(snap.data() as Partial<GamesFields>), isLoaded: true });
        return;
      }

      const legacy = readLegacyLocalStorage();
      const seed: GamesFields = legacy ? { ...DEFAULTS, ...legacy } : DEFAULTS;
      set({ ...seed, isLoaded: true });

      if (canWriteTenantConfig()) {
        try {
          await setDoc(configRef, { ...seed, migratedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.error('Migration games vers Firestore échouée (non-bloquant):', e);
        }
      }
    } catch (e) {
      console.error('Erreur chargement games depuis Firestore:', e);
      set({ isLoaded: true });
    }
  },

  addGame: (game) => set((state) => ({ games: [...state.games, game] })),
  updateGame: (id, updates) => set((state) => ({
    games: state.games.map(g => g.id === id ? { ...g, ...updates } : g)
  })),
  removeGame: (id) => set((state) => ({
    games: state.games.filter(g => g.id !== id)
  })),
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useGames.subscribe((state, prevState) => {
  if (!state.isLoaded || !prevState.isLoaded) return;
  if (!loadedTenantId || !canWriteTenantConfig()) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const { games } = useGames.getState();
      await setDoc(
        doc(db, 'tenants', loadedTenantId!, 'configuration', 'games'),
        { games, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.error('Sauvegarde games vers Firestore échouée:', e);
    }
  }, 2000);
});
