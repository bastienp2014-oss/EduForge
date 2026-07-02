import { StateCreator } from 'zustand';
import { InventorySlice, ProgressionState } from '../progressionTypes';
import { analytics } from '../../services/analytics';

export const createInventorySlice: StateCreator<ProgressionState, [], [], InventorySlice> = (set, get) => ({
  motsDebloques: [],
  inventaire: {},

  debloquerMot: (motId) => {
    const state = get();
    if (state.motsDebloques.includes(motId)) return;
    set((s) => ({
      motsDebloques: [...s.motsDebloques, motId]
    }));
    get().claimReward('unlock_word', { wordId: motId });
    get().sauvegarderVersFirebase();
  },

  acheterObjet: async (objetId, cout) => {
    const success = await get().depenserPiasses(cout);
    if (success) {
      const currentState = get();
      const qteActuelle = currentState.inventaire[objetId] || 0;
      set({
        inventaire: { ...currentState.inventaire, [objetId]: qteActuelle + 1 }
      });
      get().sauvegarderVersFirebase();
      analytics.storePurchase(objetId, cout);
      return true;
    }
    return false;
  },

  echangerObjetContreMot: async (objetId, motId) => {
    const state = get();
    const qte = state.inventaire[objetId] || 0;
    if (qte >= 1 && !state.motsDebloques.includes(motId)) {
      const nouvelInventaire = { ...state.inventaire, [objetId]: qte - 1 };
      if (nouvelInventaire[objetId] === 0) {
        delete nouvelInventaire[objetId];
      }
      set({
        inventaire: nouvelInventaire,
        motsDebloques: [...state.motsDebloques, motId]
      });
      get().sauvegarderVersFirebase();
      return true;
    }
    return false;
  }
});
