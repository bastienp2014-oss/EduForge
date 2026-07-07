import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocumentMeta {
  id: string;
  name: string;
  content?: string;
  size?: number;
}

interface SettingsState {
  persona: string;
  setPersona: (persona: string) => void;
  context: string;
  setContext: (context: string) => void;
  appGenerationPrompt: string;
  setAppGenerationPrompt: (prompt: string) => void;
  documents: DocumentMeta[];
  addDocument: (doc: DocumentMeta) => void;
  removeDocument: (id: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      persona: 'Vous êtes un assistant éducatif expert. Vous aidez à la création de contenu pédagogique interactif.',
      setPersona: (persona) => set({ persona }),
      context: '',
      setContext: (context) => set({ context }),
      appGenerationPrompt: 'Génère une application d\'apprentissage complète sur le sujet suivant. Inclus un thème de couleurs (primaire, secondaire, fond, texte), un nom d\'application, et une arborescence de 3 niveaux (chapitres) contenant 3 leçons chacun.',
      setAppGenerationPrompt: (appGenerationPrompt) => set({ appGenerationPrompt }),
      documents: [],
      addDocument: (doc) => set((state) => ({ documents: [...(state.documents || []), doc] })),
      removeDocument: (id) => set((state) => ({ documents: (state.documents || []).filter(d => d.id !== id) })),
    }),
    {
      name: 'quebec-settings',
    }
  )
);
