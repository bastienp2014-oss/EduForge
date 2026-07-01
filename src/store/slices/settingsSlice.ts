import { StateCreator } from 'zustand';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { SettingsSlice, ProgressionState } from '../progressionTypes';
import { analytics } from '../../services/analytics';
import { DEFAULT_CONFIG, captureUTM } from '../progressionConstants';
import { useTenant } from '../useTenant';

export const createSettingsSlice: StateCreator<ProgressionState, [], [], SettingsSlice> = (set, get) => ({
  audioSpeed: null,
  paysOrigine: null,
  localisationActuelle: null,
  acquisitionSource: null,
  surnom: 'L\'Anonyme de la Tuque',
  isPremium: false,
  subscriptionPlan: 'free',
  isAdmin: false,
  dateArrivee: null,
  hasCompletedOnboarding: false,
  objectifPrincipal: null,
  isFrancophone: false,
  progressionConfig: DEFAULT_CONFIG,
  uiPositions: {},
  customContentItems: [],

  setAudioSpeed: (speed) => {
    set({ audioSpeed: Math.round(speed * 20) / 20 });
  },
  setPaysOrigine: (pays) => {
    set({ paysOrigine: pays });
    get().sauvegarderVersFirebase();
  },
  setLocalisationActuelle: (loc) => {
    set({ localisationActuelle: loc });
    get().sauvegarderVersFirebase();
  },
  setAcquisitionSource: (source) => {
    set({ acquisitionSource: source });
    get().sauvegarderVersFirebase();
  },
  setSurnom: (nouveau) => {
    set({ surnom: nouveau });
    get().sauvegarderVersFirebase();
  },
  setPremium: (status) => {
    set({ isPremium: status, subscriptionPlan: status ? 'premium' : 'free' });
    get().sauvegarderVersFirebase();
  },
  setSubscriptionPlan: (plan) => {
    set({ subscriptionPlan: plan, isPremium: plan === 'premium' });
    if (plan !== 'free') analytics.subscriptionStarted(plan);
    get().sauvegarderVersFirebase();
  },
  setDateArrivee: (date) => {
    set({ dateArrivee: date });
    get().sauvegarderVersFirebase();
  },
  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
    if (!get().acquisitionSource) {
      get().setAcquisitionSource(captureUTM());
    }
    get().sauvegarderVersFirebase();
  },
  setObjectifPrincipal: (obj) => {
    set({ objectifPrincipal: obj });
    get().sauvegarderVersFirebase();
  },
  setIsFrancophone: (status) => {
    set({ isFrancophone: status });
    get().sauvegarderVersFirebase();
  },
  updateProgressionConfig: async (newConfig) => {
    set({ progressionConfig: newConfig });
    try {
      const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
      const configRef = doc(db, 'tenants', tenantId, 'configuration', 'progression');
      await setDoc(configRef, newConfig);
    } catch (err) {
      console.error('Erreur sauvegarde config progression', err);
    }
  },
  setUIPosition: (elementId, pos) => {
    set((state) => ({
      uiPositions: {
        ...state.uiPositions,
        [elementId]: pos
      }
    }));
    get().sauvegarderVersFirebase();
  },
  addCustomContentItems: (items) => {
    set(state => ({
      customContentItems: [...(state.customContentItems || []), ...items]
    }));
    get().sauvegarderVersFirebase();
  },
  getFeatureFlags: () => {
    const { subscriptionPlan, isPremium, isAdmin } = get();
    const isPrem = subscriptionPlan === 'premium' || isPremium || isAdmin;

    return {
      feature_dictionnaire: true,
      feature_quiz: true,
      feature_classement: true,
      feature_mini_games: true,        // GRATUIT — jeux arcade
      feature_advanced_grammar: true,  // GRATUIT — contractions, grammaire
      feature_rue_principale: true,    // GRATUIT — aperçu rue principale
      feature_audio: isPrem,           // PREMIUM — audio natif + vitesse
      feature_routine: true,           // GRATUIT — SRS limité à 5/jour si !isPrem
      feature_simulateurs: isPrem,     // PREMIUM — SAAQ, Loi 31
      feature_scenarios: isPrem,       // PREMIUM — Scénarios de Rue (Phase 13)
    };
  }
});
