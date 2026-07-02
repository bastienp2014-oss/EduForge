import { StateCreator } from 'zustand';
import { EconomySlice, ProgressionState } from '../progressionTypes';
import { analytics } from '../../services/analytics';
import { DEFAULT_POINTS } from '../progressionConstants';

export const createEconomySlice: StateCreator<ProgressionState, [], [], EconomySlice> = (set, get) => ({
  piasses: 0,
  xp: 0,

  addPiasses: async (montant) => {
    set((state) => ({ 
      piasses: Math.round((state.piasses + montant) * 100) / 100,
      xp: montant > 0 ? Math.round((state.xp + montant) * 100) / 100 : state.xp,
    }));
    if (montant > 0) {
      analytics.piassesEarned(montant, 'module');
      analytics.xpEarned(montant, 'module');
    }
  },

  addXp: async (montant) => {
    if (montant <= 0) return;
    set((state) => ({
      xp: Math.round((state.xp + montant) * 100) / 100,
    }));
    analytics.xpEarned(montant, 'direct');
    get().incrementStat('xp_total', montant);
    
    get().enregistrerActiviteDuJour();
  },

  depenserPiasses: async (cout) => {
    const currentState = get();
    if (currentState.piasses >= cout) {
      set({ 
        piasses: Math.round((currentState.piasses - cout) * 100) / 100 
      });
      const { auth } = await import('../../services/firebase');
      if (auth.currentUser) {
        try {
          await fetch('/api/economy/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` },
            body: JSON.stringify({ piasses: -cout })
          });
        } catch (e) {}
      }
      return true;
    }
    return false;
  },

  claimReward: async (activityId, metadata) => {
    const { auth } = await import('../../services/firebase');
    if (!auth.currentUser) return;

    try {
      const response = await fetch('/api/economy/claim-reward', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}` 
        },
        body: JSON.stringify({ activityId, ...metadata })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          set({
            piasses: result.totalPiasses,
            xp: result.totalXp
          });
          
          if (result.piassesAdded > 0) {
            analytics.piassesEarned(result.piassesAdded, activityId);
          }
          if (result.xpAdded > 0) {
            analytics.xpEarned(result.xpAdded, activityId);
            get().incrementStat('xp_total', result.xpAdded);
            get().enregistrerActiviteDuJour();
          }
          
          get().verifierBadges();
        }
      } else {
        console.error("Erreur lors de la réclamation de récompense:", response.statusText);
      }
    } catch (e) {
      console.error("Erreur réseau lors de la réclamation de récompense:", e);
    }
  },

  getNiveau: () => {
    const state = get();
    const scoreTotal = state.xp;
    const niveaux = state.progressionConfig.niveaux;
    
    let niveauActuel = 1;
    for (const niveau of niveaux) {
       if (scoreTotal >= niveau.seuilScore) {
         niveauActuel = niveau.id;
       }
    }
    
    if (state.isFrancophone && niveauActuel < 5) niveauActuel = 5;
    
    return niveauActuel;
  },

  getPointsConfig: () => {
    const state = get();
    const niveauActuel = state.getNiveau();
    const configNiveau = state.progressionConfig.niveaux.find((n: any) => n.id === niveauActuel);
    if (configNiveau && configNiveau.points) {
      return configNiveau.points;
    }
    return DEFAULT_POINTS;
  }
});
