import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppTheme } from './useTheme';

interface AdminThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  updateCustomColors: (colors: Partial<AppTheme['colors']>) => void;
  resetToDefault: () => void;
}

export const ADMIN_DEFAULT_THEME: AppTheme = {
  id: 'admin_default',
  name: 'Admin Dashboard (Bleu)',
  dark: false,
  colors: {
    primary: '#4f46e5',   // indigo-600
    accent: '#8b5cf6',    // violet-500
    header: '#0f172a',    // slate-900
    bg: '#f1f5f9',        // slate-100
    surface: '#ffffff',   // white
    ink: '#0f172a',       // slate-900
    muted: '#64748b',     // slate-500
    gold: '#fbbf24',      // amber-400
    success: '#22c55e',   // green-500
    danger: '#ef4444'     // red-500
  },
  fonts: {
    display: '"Sora", sans-serif',
    body: '"Space Grotesk", sans-serif'
  },
  scale: 1,
  radius: 'doux',
  shadow: 'doux',
  contrast: false,
  soundPack: 'doux'
};

export const ADMIN_DARK_THEME: AppTheme = {
  id: 'admin_dark',
  name: 'Admin Sombre Cosmique',
  dark: true,
  colors: {
    primary: '#3b82f6',
    accent: '#60a5fa',
    header: '#0f172a',
    bg: '#0f172a',
    surface: '#1e293b',
    ink: '#f8fafc',
    muted: '#94a3b8',
    gold: '#fbbf24',
    success: '#10b981',
    danger: '#f43f5e'
  },
  fonts: {
    display: '"Sora", sans-serif',
    body: '"Space Grotesk", sans-serif'
  },
  scale: 1,
  radius: 'doux',
  shadow: 'doux',
  contrast: false,
  soundPack: 'doux'
};

export const ADMIN_EMERALD_THEME: AppTheme = {
  id: 'admin_emerald',
  name: 'Admin Émeraude Éducatif',
  dark: false,
  colors: {
    primary: '#059669',
    accent: '#10b981',
    header: '#064e3b',
    bg: '#f0fdf4',
    surface: '#ffffff',
    ink: '#064e3b',
    muted: '#047857',
    gold: '#fbbf24',
    success: '#10b981',
    danger: '#f43f5e'
  },
  fonts: {
    display: '"Sora", sans-serif',
    body: '"Space Grotesk", sans-serif'
  },
  scale: 1,
  radius: 'doux',
  shadow: 'doux',
  contrast: false,
  soundPack: 'doux'
};

export const ADMIN_THEMES: Record<string, AppTheme> = {
  admin_default: ADMIN_DEFAULT_THEME,
  admin_dark: ADMIN_DARK_THEME,
  admin_emerald: ADMIN_EMERALD_THEME
};

export const useAdminTheme = create<AdminThemeState>()(
  persist(
    (set, get) => ({
      theme: ADMIN_DEFAULT_THEME,
      setTheme: (theme: AppTheme) => set({ theme }),
      updateCustomColors: (colors) => {
        const currentTheme = get().theme;
        set({
          theme: {
            ...currentTheme,
            colors: {
              ...currentTheme.colors,
              ...colors
            }
          }
        });
      },
      resetToDefault: () => {
        set({ theme: ADMIN_DEFAULT_THEME });
      }
    }),
    {
      name: 'mots-et-blocs-admin-theme-new',
    }
  )
);

