import { create } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

export type NavItem = {
  id: string;
  label: string;
  iconName: string;
  enabled: boolean;
};

export type CurrencyConfig = {
  name: string;      // e.g., "Piasses", "Points", "Étoiles"
  symbol: string;    // e.g., "$", "pts", "⭐"
  position: 'prefix' | 'suffix';
};

export type TagConfig = {
  id: string;
  label: string;
  color?: string;
};

export type FeatureFlags = {
  enableQuebecTaxes: boolean;
  enableAiGenerator: boolean;
  enableGameGenerator: boolean;
  enableStore: boolean;
};

interface AppConfigFields {
  navItems: NavItem[];
  appName: string;
  appDescription: string;
  marketingSlogan: string;
  currency: CurrencyConfig;
  features: FeatureFlags;
  srsConfig: { maxDailyItems: number; maxNewItems: number };
  tags: TagConfig[];
}

interface AppConfigState extends AppConfigFields {
  isLoaded: boolean;
  load: (tenantId: string) => Promise<void>;
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  setAppName: (name: string) => void;
  setAppDescription: (desc: string) => void;
  setMarketingSlogan: (slogan: string) => void;
  setCurrency: (config: Partial<CurrencyConfig>) => void;
  setFeatures: (features: Partial<FeatureFlags>) => void;
  setSrsConfig: (config: Partial<{ maxDailyItems: number; maxNewItems: number }>) => void;
  setTags: (tags: TagConfig[]) => void;
  addTag: (tag: TagConfig) => void;
  removeTag: (id: string) => void;
  updateTag: (id: string, updates: Partial<TagConfig>) => void;
}

const DEFAULTS: AppConfigFields = {
  appName: 'Mots & Blocs',
  appDescription: '',
  marketingSlogan: '',
  navItems: [
    { id: 'home', label: 'Accueil', iconName: 'Home', enabled: true },
    { id: 'ville', label: 'Ville', iconName: 'Map', enabled: true },
    { id: 'arcade', label: 'Jeux', iconName: 'Gamepad2', enabled: true },
    { id: 'portefeuille', label: 'Profil', iconName: 'User', enabled: true },
  ],
  currency: {
    name: 'Piasses',
    symbol: '$',
    position: 'suffix',
  },
  features: {
    enableQuebecTaxes: true,
    enableAiGenerator: true,
    enableGameGenerator: true,
    enableStore: true,
  },
  srsConfig: {
    maxDailyItems: 15,
    maxNewItems: 5,
  },
  tags: [
    { id: 'vocab', label: 'Vocabulaire', color: '#3b82f6' },
    { id: 'expr', label: 'Expressions', color: '#10b981' },
    { id: 'lecon1', label: 'Leçon 1', color: '#8b5cf6' },
    { id: 'urgence', label: 'Urgence', color: '#ef4444' },
  ],
};

const LEGACY_STORAGE_KEY = 'quebec-app-config';

function canWriteTenantConfig(): boolean {
  const role = useAuth.getState().claims?.role;
  return role === 'superadmin' || role === 'admin' || role === 'owner';
}

function readLegacyLocalStorage(): Partial<AppConfigFields> | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const legacy = parsed?.state;
    if (legacy && typeof legacy === 'object') return legacy as Partial<AppConfigFields>;
  } catch (e) {
    console.error('Lecture localStorage legacy appConfig échouée:', e);
  }
  return null;
}

let loadedTenantId: string | null = null;

export const useAppConfig = create<AppConfigState>()((set) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async (tenantId: string) => {
    loadedTenantId = tenantId;
    set({ ...DEFAULTS, isLoaded: false });

    const configRef = doc(db, 'tenants', tenantId, 'configuration', 'appConfig');
    try {
      const snap = await getDoc(configRef);

      if (snap.exists()) {
        set({ ...DEFAULTS, ...(snap.data() as Partial<AppConfigFields>), isLoaded: true });
        return;
      }

      const legacy = readLegacyLocalStorage();
      const seed: AppConfigFields = legacy ? { ...DEFAULTS, ...legacy } : DEFAULTS;
      set({ ...seed, isLoaded: true });

      if (canWriteTenantConfig()) {
        try {
          await setDoc(configRef, { ...seed, migratedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.error('Migration appConfig vers Firestore échouée (non-bloquant):', e);
        }
      }
    } catch (e) {
      console.error('Erreur chargement appConfig depuis Firestore:', e);
      set({ isLoaded: true });
    }
  },

  updateNavItem: (id, updates) => set((state) => ({
    navItems: state.navItems.map(item => item.id === id ? { ...item, ...updates } : item)
  })),
  setAppName: (name) => set({ appName: name }),
  setAppDescription: (desc) => set({ appDescription: desc }),
  setMarketingSlogan: (slogan) => set({ marketingSlogan: slogan }),
  setCurrency: (config) => set((state) => ({ currency: { ...state.currency, ...config } })),
  setFeatures: (features) => set((state) => ({ features: { ...state.features, ...features } })),
  setSrsConfig: (config) => set((state) => ({ srsConfig: { ...state.srsConfig, ...config } })),
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (id) => set((state) => ({ tags: state.tags.filter(t => t.id !== id) })),
  updateTag: (id, updates) => set((state) => ({
    tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useAppConfig.subscribe((state, prevState) => {
  if (!state.isLoaded || !prevState.isLoaded) return;
  if (!loadedTenantId || !canWriteTenantConfig()) return;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const state = useAppConfig.getState();
      const fields: AppConfigFields = {
        navItems: state.navItems,
        appName: state.appName,
        appDescription: state.appDescription,
        marketingSlogan: state.marketingSlogan,
        currency: state.currency,
        features: state.features,
        srsConfig: state.srsConfig,
        tags: state.tags,
      };
      await setDoc(
        doc(db, 'tenants', loadedTenantId!, 'configuration', 'appConfig'),
        { ...fields, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.error('Sauvegarde appConfig vers Firestore échouée:', e);
    }
  }, 2000);
});
