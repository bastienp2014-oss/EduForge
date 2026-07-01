/**
 * useTheme.extended.ts — Mots & Blocs
 * Extension du store de thème existant.
 *
 * INTÉGRATION :
 *   Remplacer le contenu de src/store/useTheme.ts par ce fichier.
 *   Supprimer useTheme.backup.ts.
 *
 * CHANGEMENTS vs l'original :
 *   + fonts: { display, body }          → polices par thème
 *   + scale: 0.9 | 1 | 1.12            → taille du texte
 *   + radius: 'carre'|'doux'|'rond'     → arrondi des coins
 *   + shadow: 'plat'|'doux'|'prononce'  → niveau d'ombrage
 *   + contrast: boolean                 → mode contrasté (accessibilité)
 *   + soundPack: string                 → pack sonore (futur)
 *   + 12 thèmes prédéfinis
 *   + personalTheme: AppTheme | null    → thème personnalisé persisté
 *   + setPersonalTheme / patchPersonal
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppColors {
  primary: string;     // Bouton principal, surbrillance active
  accent: string;      // Badges, 2ème couleur d'accent
  header: string;      // Fond du HUD / header
  bg: string;          // Fond général des écrans
  surface: string;     // Cartes, panneaux, modales
  ink: string;         // Texte principal
  muted: string;       // Texte secondaire, indices
  gold: string;        // Piasses / monnaie virtuelle
  success: string;     // Bonne réponse, streak
  danger: string;      // Mauvaise réponse, vie perdue
  // Legacy support for older components
  text?: string;
  textMuted?: string;
  border?: string;
  background?: string;
  primaryHover?: string;
  secondary?: string;
}

export interface AppFonts {
  display: string;     // Police des titres, scores, labels importants
  body: string;        // Police du texte courant
}

export type RadiusMode  = 'carre' | 'doux' | 'rond';
export type ShadowMode  = 'plat'  | 'doux' | 'prononce';
export type SoundPack   = 'foret' | 'arcade' | 'doux';

export interface AppTheme {
  id: string;
  name: string;
  dark: boolean;
  colors: AppColors;
  fonts: AppFonts;
  scale: number;           // 0.9 | 1 | 1.12
  radius: RadiusMode;
  shadow: ShadowMode;
  contrast: boolean;
  soundPack: SoundPack;
  // Champs personnalisation
  baseName?: string;       // Nom du thème source si dupliqué
  visualStyle?: {
    description?: string;
  };
  aiContext?: {
    targetAudience?: string;
    tone?: string;
    artisticStyle?: string;
    styleReferenceImage?: string;
  };
  images?: {
    logo?: string;
    homeBanner?: string;
    villeMapBackground?: string;
  };
}

// ─── Token CSS helpers ────────────────────────────────────────────────────────
// Appeler applyThemeTokens(theme) dans App.tsx → componentDidMount / useEffect
// pour propager les tokens CSS sur :root.

export function applyThemeTokens(theme: AppTheme) {
  if (!theme) return;
  const root = document.documentElement;
  const c: Partial<AppColors> = theme.colors || {};
  root.style.setProperty('--color-primary',  c.primary || '#C75B39');
  root.style.setProperty('--color-accent',   c.accent || '#3E5C8A');
  root.style.setProperty('--color-header',   c.header || '#2D1B0E');
  root.style.setProperty('--color-bg',       c.bg || '#FBF6EE');
  root.style.setProperty('--color-surface',  c.surface || '#FFFFFF');
  root.style.setProperty('--color-ink',      c.ink || '#2D1B0E');
  root.style.setProperty('--color-muted',    c.muted || '#9A7B5C');
  root.style.setProperty('--color-gold',     c.gold || '#F5C542');
  root.style.setProperty('--color-success',  c.success || '#2F7A52');
  root.style.setProperty('--color-danger',   c.danger || '#C73C3C');
  root.style.setProperty('--font-display',   theme.fonts?.display || "'Sora', sans-serif");
  root.style.setProperty('--font-body',      theme.fonts?.body || "'Space Grotesk', sans-serif");
  root.style.setProperty('--theme-scale',    String(theme.scale || 1));
  // Radius map
  const RADII = { carre:'8px', doux:'16px', rond:'24px' };
  root.style.setProperty('--radius-card', RADII[(theme.radius || 'doux') as keyof typeof RADII]);
  root.style.setProperty('--radius-btn',  theme.radius === 'carre' ? '8px' : theme.radius === 'doux' ? '11px' : '16px');
  // Shadow map
  const SHADS = { plat:'none', doux:'0 2px 10px rgba(0,0,0,.06)', prononce:'0 12px 26px rgba(0,0,0,.18)' };
  root.style.setProperty('--shadow-card', SHADS[(theme.shadow || 'doux') as keyof typeof SHADS]);
  // Border
  const border = theme.contrast
    ? (theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)')
    : (theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
  root.style.setProperty('--color-border', border);
}

// ─── Thèmes prédéfinis ────────────────────────────────────────────────────────

const BASE_FONTS: AppFonts = {
  display: "'Sora', sans-serif",
  body:    "'Space Grotesk', sans-serif",
};

export const PREDEFINED_THEMES: AppTheme[] = [
  {
    id: 'automne', name: 'Automne Boréal', dark: false,
    colors: { primary:'#C75B39', accent:'#3E5C8A', header:'#2D1B0E', bg:'#FBF6EE', surface:'#FFFFFF', ink:'#2D1B0E', muted:'#9A7B5C', gold:'#F5C542', success:'#2F7A52', danger:'#C73C3C' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'minuit', name: 'Minuit Laurentien', dark: true,
    colors: { primary:'#4A90D9', accent:'#E05C2A', header:'#0D1B2A', bg:'#0D1B2A', surface:'#162233', ink:'#E8F0F8', muted:'#7A9BB5', gold:'#F5C542', success:'#2F9A62', danger:'#D94A4A' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'bleu_classique', name: 'Bleu Classique', dark: false,
    colors: { primary:'#4f46e5', accent:'#6366f1', header:'#1e1b4b', bg:'#f8fafc', surface:'#ffffff', ink:'#0f172a', muted:'#64748b', gold:'#fbbf24', success:'#10b981', danger:'#ef4444' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'sombre_cosmique', name: 'Sombre Cosmique', dark: true,
    colors: { primary:'#3b82f6', accent:'#60a5fa', header:'#0f172a', bg:'#0f172a', surface:'#1e293b', ink:'#f8fafc', muted:'#94a3b8', gold:'#fbbf24', success:'#10b981', danger:'#f43f5e' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'arcade',
  },
  {
    id: 'emeraude_educatif', name: 'Émeraude Éducatif', dark: false,
    colors: { primary:'#059669', accent:'#10b981', header:'#064e3b', bg:'#f0fdf4', surface:'#ffffff', ink:'#064e3b', muted:'#047857', gold:'#fbbf24', success:'#10b981', danger:'#f43f5e' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'aurore_polaire', name: 'Aurore Polaire', dark: true,
    colors: { primary:'#14b8a6', accent:'#a855f7', header:'#090d16', bg:'#090d16', surface:'#111827', ink:'#f3f4f6', muted:'#9ca3af', gold:'#f59e0b', success:'#10b981', danger:'#ef4444' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'prononce', contrast:false, soundPack:'arcade',
  },
  {
    id: 'peche_melba', name: 'Pêche Melba', dark: false,
    colors: { primary:'#f97316', accent:'#ec4899', header:'#7c2d12', bg:'#fff7ed', surface:'#ffffff', ink:'#431407', muted:'#9a3412', gold:'#f59e0b', success:'#16a34a', danger:'#dc2626' },
    fonts: { display:"'Fredoka', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'menthe_fraiche', name: 'Menthe Fraîche', dark: false,
    colors: { primary:'#0d9488', accent:'#0284c7', header:'#115e59', bg:'#f0fdfa', surface:'#ffffff', ink:'#115e59', muted:'#0f766e', gold:'#eab308', success:'#10b981', danger:'#ef4444' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'erable', name: 'Forêt d\'Érable', dark: false,
    colors: { primary:'#2D7A4F', accent:'#C75B39', header:'#1B3A2D', bg:'#F2F7F4', surface:'#FFFFFF', ink:'#1B3A2D', muted:'#6A9A80', gold:'#F5C542', success:'#2D7A4F', danger:'#C73C3C' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'neige', name: 'Première Neige', dark: false,
    colors: { primary:'#2B5AA0', accent:'#C75B39', header:'#1A2B4A', bg:'#F4F7FB', surface:'#FFFFFF', ink:'#1A2B4A', muted:'#7A8A9A', gold:'#F5C542', success:'#2F7A52', danger:'#C73C3C' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'arcade', name: 'Néon Arcade', dark: true,
    colors: { primary:'#D946EF', accent:'#06B6D4', header:'#0A0A1A', bg:'#0A0A1A', surface:'#141428', ink:'#F0F0FF', muted:'#8888BB', gold:'#FFD700', success:'#22C55E', danger:'#EF4444' },
    fonts: { display:"'Fredoka', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'prononce', contrast:false, soundPack:'arcade',
  },
  {
    id: 'cabane', name: 'Cabane à Sucre', dark: false,
    colors: { primary:'#A0522D', accent:'#8B0000', header:'#4A2010', bg:'#FDF5E6', surface:'#FFF8F0', ink:'#3C1810', muted:'#8B6050', gold:'#DAA520', success:'#556B2F', danger:'#8B0000' },
    fonts: { display:"'Fredoka', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'saint_jean', name: 'Fête Saint-Jean', dark: true,
    colors: { primary:'#FFD700', accent:'#1E90FF', header:'#00008B', bg:'#00008B', surface:'#0000A0', ink:'#FFFFFF', muted:'#AAAACC', gold:'#FFD700', success:'#00C851', danger:'#FF4444' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'doux', contrast:false, soundPack:'arcade',
  },
  {
    id: 'toundra', name: 'Toundra Boréale', dark: true,
    colors: { primary:'#7FBBFF', accent:'#FF9A5C', header:'#0A1628', bg:'#0E1E38', surface:'#162844', ink:'#D8EAFF', muted:'#6A8FAA', gold:'#FFD166', success:'#4ECDC4', danger:'#FF6B6B' },
    fonts: { display:"'Space Grotesk', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'poutine', name: 'Fromage en Crottes', dark: false,
    colors: { primary:'#E8A020', accent:'#C0392B', header:'#5D2E0C', bg:'#FFF8EE', surface:'#FFFFFF', ink:'#3C2010', muted:'#9A7050', gold:'#E8A020', success:'#27AE60', danger:'#E74C3C' },
    fonts: { display:"'Fredoka', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'doux', contrast:false, soundPack:'foret',
  },
  {
    id: 'fleuve', name: 'Fleuve Saint-Laurent', dark: false,
    colors: { primary:'#1A6FA0', accent:'#C07030', header:'#0A3050', bg:'#F0F6FA', surface:'#FFFFFF', ink:'#0A2A40', muted:'#5A8AAA', gold:'#F0C050', success:'#2A8A50', danger:'#C03030' },
    fonts: { display:"'Sora', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'violette', name: 'Violette des Prés', dark: false,
    colors: { primary:'#7C3AED', accent:'#EC4899', header:'#2D1B69', bg:'#FAF8FF', surface:'#FFFFFF', ink:'#1E1040', muted:'#7C6A9A', gold:'#F59E0B', success:'#059669', danger:'#DC2626' },
    fonts: { display:"'Outfit', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'rond', shadow:'doux', contrast:false, soundPack:'doux',
  },
  {
    id: 'nuit_polaire', name: 'Nuit Polaire', dark: true,
    colors: { primary:'#00D4FF', accent:'#FF6B6B', header:'#030312', bg:'#050520', surface:'#0A0A35', ink:'#E8F4FF', muted:'#5A6A9A', gold:'#FFD700', success:'#00FF88', danger:'#FF4444' },
    fonts: { display:"'Outfit', sans-serif", body:"'Space Grotesk', sans-serif" },
    scale:1, radius:'doux', shadow:'prononce', contrast:false, soundPack:'arcade',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface ThemeState {
  activeThemeId: string;
  personalTheme: AppTheme | null;
  // Sélecteurs
  theme: AppTheme;
  // Actions
  setThemeById: (id: string) => void;
  setPersonalTheme: (t: AppTheme) => void;
  patchPersonal: (patch: Partial<AppTheme>) => void;
  resetPersonal: () => void;
}

function getThemeById(id: string, personal: AppTheme | null): AppTheme {
  const base = (id === 'personal' && personal) ? personal : (PREDEFINED_THEMES.find(t => t.id === id) || PREDEFINED_THEMES[0]);
  return {
    ...PREDEFINED_THEMES[0], // fallback for missing fields
    ...base,
    colors: {
      ...PREDEFINED_THEMES[0].colors,
      ...base.colors,
      text: base.colors?.ink || PREDEFINED_THEMES[0].colors.ink,
      textMuted: base.colors?.muted || PREDEFINED_THEMES[0].colors.muted,
      background: base.colors?.bg || PREDEFINED_THEMES[0].colors.bg,
      border: base.contrast ? (base.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)') : (base.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'),
      primaryHover: base.colors?.primary || PREDEFINED_THEMES[0].colors.primary,
      secondary: base.colors?.muted || PREDEFINED_THEMES[0].colors.muted,
    }
  };
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'automne',
      personalTheme: null,
      theme: getThemeById('automne', null),

      setThemeById(id: string) {
        const state = get();
        const newTheme = getThemeById(id, state.personalTheme);
        set({ activeThemeId: id, theme: newTheme });
        applyThemeTokens(newTheme);
      },

      setPersonalTheme(t: AppTheme) {
        const newTheme = { ...t, id: 'personal' };
        set({ personalTheme: newTheme, activeThemeId: 'personal', theme: getThemeById('personal', newTheme) });
        applyThemeTokens(newTheme);
      },

      patchPersonal(patch: Partial<AppTheme>) {
        const current = get();
        // Si aucun thème personnel, cloner le thème actif
        const base = current.personalTheme
          || { ...getThemeById(current.activeThemeId, null), id:'personal', baseName: getThemeById(current.activeThemeId, null).name };
        const updated: AppTheme = { ...base, ...patch, id:'personal' };
        set({ personalTheme: updated, activeThemeId: 'personal', theme: getThemeById('personal', updated) });
        applyThemeTokens(updated);
      },

      resetPersonal() {
        const newTheme = getThemeById('automne', null);
        set({ personalTheme: null, activeThemeId: 'automne', theme: newTheme });
        applyThemeTokens(newTheme);
      },
    }),
    {
      name: 'mots-blocs-theme-v2',
      // Ne persister que les champs nécessaires
      partialize: (s) => ({
        activeThemeId: s.activeThemeId,
        personalTheme: s.personalTheme,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = getThemeById(state.activeThemeId, state.personalTheme);
          applyThemeTokens(state.theme);
        }
      }
    }
  )
);

// ─── Hook helpers (usage dans les composants) ─────────────────────────────────

/** Retourne les couleurs du thème actif — raccourci pratique */
export const useColors = () => useTheme(s => s.theme.colors);

/** Retourne les tokens CSS calculés (radius, shadow, border) */
export function useThemeTokens() {
  const theme = useTheme(s => s.theme) || getThemeById('automne', null);
  const RADII  = { carre:{ card:'8px',  btn:'8px'  }, doux:{ card:'16px', btn:'11px' }, rond:{ card:'24px', btn:'16px' } };
  const SHADS  = { plat:'none', doux:'0 2px 10px rgba(0,0,0,.06)', prononce:'0 12px 26px rgba(0,0,0,.18)' };
  
  const radiusKey = theme.radius && RADII[theme.radius] ? theme.radius : 'doux';
  const shadowKey = theme.shadow && SHADS[theme.shadow] ? theme.shadow : 'doux';
  
  const radii  = RADII[radiusKey];
  const shadow = SHADS[shadowKey];
  const border = theme.contrast
    ? (theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)')
    : (theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
  return { radCard: radii.card, radBtn: radii.btn, shadow, border, scale: theme.scale || 1 };
}
