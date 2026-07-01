import { StateCreator } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { SyncSlice, ProgressionState } from '../progressionTypes';
import { analytics } from '../../services/analytics';
import { useTenant } from '../useTenant';
import { DEFAULT_CONFIG } from '../progressionConstants';
import { ProgressionConfig } from '../progressionTypes';
import { useAuth } from '../useAuth';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const createSyncSlice: StateCreator<ProgressionState, [], [], SyncSlice> = (set, get) => ({
  synchroniserDepuisFirebase: async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const claims = useAuth.getState().claims;
      const role = claims?.role;
      const isAdmin = role === 'superadmin' || role === 'admin' || user.email === 'bastienp2014@gmail.com';

      const docRef = doc(db, 'utilisateurs', user.uid);
      const docSnap = await getDoc(docRef);

      const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
      const configRef = doc(db, 'tenants', tenantId, 'configuration', 'progression');
      const configSnap = await getDoc(configRef);
      let loadedConfig = DEFAULT_CONFIG;
      if (configSnap.exists()) {
          loadedConfig = configSnap.data() as ProgressionConfig;
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        const piassesExistantes = data.piasses || 0;
        const motsExistants = data.motsDebloques || [];
        const xpInitial = data.xp ?? (piassesExistantes + (motsExistants.length * 10));

        set({
          piasses: piassesExistantes,
          xp: xpInitial,
          streakCount: data.streakCount || 0,
          lastActiveDay: data.lastActiveDay || null,
          longestStreak: data.longestStreak || 0,
          motsDebloques: motsExistants,
          surnom: data.surnom || 'L\'Anonyme de la Tuque',
          inventaire: data.inventaire || {},
          isPremium: data.isPremium || false,
          subscriptionPlan: data.subscriptionPlan || (data.isPremium ? 'premium' : 'free'),
          isAdmin,
          dateArrivee: data.dateArrivee || null,
          paysOrigine: data.paysOrigine || null,
          localisationActuelle: data.localisationActuelle || null,
          acquisitionSource: data.acquisitionSource || null,
          hasCompletedOnboarding: data.hasCompletedOnboarding || false,
          objectifPrincipal: data.objectifPrincipal || null,
          isFrancophone: data.isFrancophone || false,
          progressionConfig: loadedConfig,
          scenariosCompletes: data.scenariosCompletes || {},
          stats: data.stats || {},
          badgesDeclenches: data.badgesDeclenches || {},
          uiPositions: data.uiPositions || {},
          leconsCompletes: data.leconsCompletes || {},
          customContentItems: data.customContentItems || [],
          courseProgressions: data.courseProgressions || {},
          entitlements: data.entitlements || []
        });
        
        get().verifierBadges(); 
      } else {
        set({ 
          progressionConfig: loadedConfig,
          isAdmin
        });
      }
      if (user) analytics.identify(user.uid, { is_admin: isAdmin });
    } catch (error) {
      console.error('Erreur lors de la synchronisation depuis Firebase:', error);
    }
  },

  sauvegarderVersFirebase: async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (saveTimeout) clearTimeout(saveTimeout);
    
    saveTimeout = setTimeout(async () => {
      try {
        const state = get();
        const docRef = doc(db, 'utilisateurs', user.uid);
        const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';

        await setDoc(docRef, {
          streakCount: state.streakCount,
          lastActiveDay: state.lastActiveDay,
          longestStreak: state.longestStreak,
          motsDebloques: state.motsDebloques,
          surnom: state.surnom,
          inventaire: state.inventaire,
          dateArrivee: state.dateArrivee,
          paysOrigine: state.paysOrigine,
          localisationActuelle: state.localisationActuelle,
          acquisitionSource: state.acquisitionSource,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          objectifPrincipal: state.objectifPrincipal,
          isFrancophone: state.isFrancophone,
          scenariosCompletes: state.scenariosCompletes,
          stats: state.stats,
          badgesDeclenches: state.badgesDeclenches,
          uiPositions: state.uiPositions,
          leconsCompletes: state.leconsCompletes,
          customContentItems: state.customContentItems || [],
          courseProgressions: state.courseProgressions,
          tenantId,
          derniereMiseAJour: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde utilisateurs vers Firebase:', error);
      }

      try {
        const state = get();
        const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
        const classementRef = doc(db, 'classement', user.uid);
        await setDoc(classementRef, {
          surnom: state.surnom,
          scoreTotal: state.xp,
          tenantId,
          derniereMiseAJour: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Erreur lors de la sauvegarde classement vers Firebase:', error);
      }
    }, 2000);
  }
});
