import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AppConfigState {
  navItems: NavItem[];
  updateNavItem: (id: string, updates: Partial<NavItem>) => void;
  appName: string;
  setAppName: (name: string) => void;
  appDescription: string;
  setAppDescription: (desc: string) => void;
  marketingSlogan: string;
  setMarketingSlogan: (slogan: string) => void;
  currency: CurrencyConfig;
  setCurrency: (config: Partial<CurrencyConfig>) => void;
  features: FeatureFlags;
  setFeatures: (features: Partial<FeatureFlags>) => void;
  srsConfig: { maxDailyItems: number; maxNewItems: number };
  setSrsConfig: (config: Partial<{ maxDailyItems: number; maxNewItems: number }>) => void;
  tags: TagConfig[];
  setTags: (tags: TagConfig[]) => void;
  addTag: (tag: TagConfig) => void;
  removeTag: (id: string) => void;
  updateTag: (id: string, updates: Partial<TagConfig>) => void;
}

export const useAppConfig = create<AppConfigState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'quebec-app-config',
    }
  )
);
