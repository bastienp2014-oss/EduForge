import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface GamesState {
  games: GameConfig[];
  addGame: (game: GameConfig) => void;
  updateGame: (id: string, updates: Partial<GameConfig>) => void;
  removeGame: (id: string) => void;
}

export const useGames = create<GamesState>()(
  persist(
    (set) => ({
      games: DEFAULT_GAMES,
      addGame: (game) => set((state) => ({ games: [...state.games, game] })),
      updateGame: (id, updates) => set((state) => ({
        games: state.games.map(g => g.id === id ? { ...g, ...updates } : g)
      })),
      removeGame: (id) => set((state) => ({
        games: state.games.filter(g => g.id !== id)
      })),
    }),
    {
      name: 'quebec-games',
    }
  )
);
