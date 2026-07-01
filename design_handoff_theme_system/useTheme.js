/**
 * useTheme.js — Mots & Blocs (version JavaScript)
 * Extension du store de thème existant.
 *
 * INTÉGRATION :
 *   Remplacer le contenu de src/store/useTheme.js par ce fichier.
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

// ─── Helpers couleur ─────────────────────────────────────────────────────
function hexToHSL(hex) {
  const h6 = (hex || '#888888').replace('#', '').slice(0, 6);
  let r = parseInt(h6.slice(0, 2), 16) / 255;
  let g = parseInt(h6.slice(2, 4), 16) / 255;
  let b = parseInt(h6.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0.5, 0.5];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}

function hslToHex(h, s, l) {
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const hh = ((h % 360) + 360) % 360, ss = clamp(s, 0, 1), ll = clamp(l, 0, 1);
  const a = ss * Math.min(ll, 1 - ll);
  const f = n => {
    const k = (n + hh / 30) % 12;
    const c = a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * clamp(ll - c, 0, 1)).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

// ─── Token CSS helper ────────────────────────────────────────────────────
export function applyThemeTokens(theme) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-accent', c.accent);
  root.style.setProperty('--color-header', c.header);
  root.style.setProperty('--color-bg', c.bg);
  root.style.setProperty('--color-surface', c.surface);
  root.style.setProperty('--color-ink', c.ink);
  root.style.setProperty('--color-muted', c.muted);
  root.style.setProperty('--color-gold', c.gold);
  root.style.setProperty('--color-success', c.success);
  root.style.setProperty('--color-danger', c.danger);
  root.style.setProperty('--font-display', theme.fonts.display);
  root.style.setProperty('--font-body', theme.fonts.body);
  root.style.setProperty('--theme-scale', String(theme.scale));
  // Radius map
  const RADII = { carre: '8px', doux: '16px', rond: '24px' };
  root.style.setProperty('--radius-card', RADII[theme.radius]);
  root.style.setProperty('--radius-btn', theme.radius === 'carre' ? '8px' : theme.radius === 'doux' ? '11px' : '16px');
  // Shadow map
  const SHADS = { plat: 'none', doux: '0 2px 10px rgba(0,0,0,.06)', prononce: '0 12px 26px rgba(0,0,0,.18)' };
  root.style.setProperty('--shadow-card', SHADS[theme.shadow]);
  // Border
  const border = theme.contrast
    ? (theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)')
    : (theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
  root.style.setProperty('--color-border', border);
}

// ─── Thèmes prédéfinis ──────────────────────────────────────────────────

export const PREDEFINED_THEMES = [
  {
    id: 'automne', name: 'Automne Boréal', dark: false,
    colors: { primary: '#C75B39', accent: '#3E5C8A', header: '#2D1B0E', bg: '#FBF6EE', surface: '#FFFFFF', ink: '#2D1B0E', muted: '#9A7B5C', gold: '#F5C542', success: '#2F7A52', danger: '#C73C3C' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'foret',
  },
  {
    id: 'minuit', name: 'Minuit Laurentien', dark: true,
    colors: { primary: '#4A90D9', accent: '#E05C2A', header: '#0D1B2A', bg: '#0D1B2A', surface: '#162233', ink: '#E8F0F8', muted: '#7A9BB5', gold: '#F5C542', success: '#2F9A62', danger: '#D94A4A' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'doux',
  },
  {
    id: 'erable', name: 'Forêt d\'Érable', dark: false,
    colors: { primary: '#2D7A4F', accent: '#C75B39', header: '#1B3A2D', bg: '#F2F7F4', surface: '#FFFFFF', ink: '#1B3A2D', muted: '#6A9A80', gold: '#F5C542', success: '#2D7A4F', danger: '#C73C3C' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'foret',
  },
  {
    id: 'neige', name: 'Première Neige', dark: false,
    colors: { primary: '#2B5AA0', accent: '#C75B39', header: '#1A2B4A', bg: '#F4F7FB', surface: '#FFFFFF', ink: '#1A2B4A', muted: '#7A8A9A', gold: '#F5C542', success: '#2F7A52', danger: '#C73C3C' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'doux',
  },
  {
    id: 'arcade', name: 'Néon Arcade', dark: true,
    colors: { primary: '#D946EF', accent: '#06B6D4', header: '#0A0A1A', bg: '#0A0A1A', surface: '#141428', ink: '#F0F0FF', muted: '#8888BB', gold: '#FFD700', success: '#22C55E', danger: '#EF4444' },
    fonts: { display: "'Fredoka', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'rond', shadow: 'prononce', contrast: false, soundPack: 'arcade',
  },
  {
    id: 'cabane', name: 'Cabane à Sucre', dark: false,
    colors: { primary: '#A0522D', accent: '#8B0000', header: '#4A2010', bg: '#FDF5E6', surface: '#FFF8F0', ink: '#3C1810', muted: '#8B6050', gold: '#DAA520', success: '#556B2F', danger: '#8B0000' },
    fonts: { display: "'Fredoka', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'foret',
  },
  {
    id: 'saint_jean', name: 'Fête Saint-Jean', dark: true,
    colors: { primary: '#FFD700', accent: '#1E90FF', header: '#00008B', bg: '#00008B', surface: '#0000A0', ink: '#FFFFFF', muted: '#AAAACC', gold: '#FFD700', success: '#00C851', danger: '#FF4444' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'rond', shadow: 'doux', contrast: false, soundPack: 'arcade',
  },
  {
    id: 'toundra', name: 'Toundra Boréale', dark: true,
    colors: { primary: '#7FBBFF', accent: '#FF9A5C', header: '#0A1628', bg: '#0E1E38', surface: '#162844', ink: '#D8EAFF', muted: '#6A8FAA', gold: '#FFD166', success: '#4ECDC4', danger: '#FF6B6B' },
    fonts: { display: "'Space Grotesk', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'doux',
  },
  {
    id: 'poutine', name: 'Fromage en Crottes', dark: false,
    colors: { primary: '#E8A020', accent: '#C0392B', header: '#5D2E0C', bg: '#FFF8EE', surface: '#FFFFFF', ink: '#3C2010', muted: '#9A7050', gold: '#E8A020', success: '#27AE60', danger: '#E74C3C' },
    fonts: { display: "'Fredoka', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'rond', shadow: 'doux', contrast: false, soundPack: 'foret',
  },
  {
    id: 'fleuve', name: 'Fleuve Saint-Laurent', dark: false,
    colors: { primary: '#1A6FA0', accent: '#C07030', header: '#0A3050', bg: '#F0F6FA', surface: '#FFFFFF', ink: '#0A2A40', muted: '#5A8AAA', gold: '#F0C050', success: '#2A8A50', danger: '#C03030' },
    fonts: { display: "'Sora', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'doux', contrast: false, soundPack: 'doux',
  },
  {
    id: 'violette', name: 'Violette des Prés', dark: false,
    colors: { primary: '#7C3AED', accent: '#EC4899', header: '#2D1B69', bg: '#FAF8FF', surface: '#FFFFFF', ink: '#1E1040', muted: '#7C6A9A', gold: '#F59E0B', success: '#059669', danger: '#DC2626' },
    fonts: { display: "'Outfit', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'rond', shadow: 'doux', contrast: false, soundPack: 'doux',
  },
  {
    id: 'nuit_polaire', name: 'Nuit Polaire', dark: true,
    colors: { primary: '#00D4FF', accent: '#FF6B6B', header: '#030312', bg: '#050520', surface: '#0A0A35', ink: '#E8F4FF', muted: '#5A6A9A', gold: '#FFD700', success: '#00FF88', danger: '#FF4444' },
    fonts: { display: "'Outfit', sans-serif", body: "'Space Grotesk', sans-serif" },
    scale: 1, radius: 'doux', shadow: 'prononce', contrast: false, soundPack: 'arcade',
  },
];

// ─── Store ──────────────────────────────────────────────────────────────

function getThemeById(id, personal) {
  if (id === 'personal' && personal) return personal;
  return PREDEFINED_THEMES.find(t => t.id === id) || PREDEFINED_THEMES[0];
}

export const useTheme = create(
  persist(
    (set, get) => ({
      activeThemeId: 'automne',
      personalTheme: null,

      get theme() {
        const s = get();
        return getThemeById(s.activeThemeId, s.personalTheme);
      },

      setThemeById(id) {
        set({ activeThemeId: id });
        const theme = getThemeById(id, get().personalTheme);
        applyThemeTokens(theme);
      },

      setPersonalTheme(t) {
        set({ personalTheme: { ...t, id: 'personal' }, activeThemeId: 'personal' });
        applyThemeTokens(t);
      },

      patchPersonal(patch) {
        const current = get();
        const base = current.personalTheme
          || { ...getThemeById(current.activeThemeId, null), id: 'personal', baseName: getThemeById(current.activeThemeId, null).name };
        const updated = { ...base, ...patch, id: 'personal' };
        set({ personalTheme: updated, activeThemeId: 'personal' });
        applyThemeTokens(updated);
      },

      resetPersonal() {
        set({ personalTheme: null, activeThemeId: 'automne' });
        applyThemeTokens(PREDEFINED_THEMES[0]);
      },
    }),
    {
      name: 'mots-blocs-theme-v2',
      partialize: (s) => ({
        activeThemeId: s.activeThemeId,
        personalTheme: s.personalTheme,
      }),
    }
  )
);

// ─── Hook helpers (usage dans les composants) ───────────────────────────

export const useColors = () => useTheme(s => s.theme.colors);

export function useThemeTokens() {
  const theme = useTheme(s => s.theme);
  const RADII = { carre: { card: '8px', btn: '8px' }, doux: { card: '16px', btn: '11px' }, rond: { card: '24px', btn: '16px' } };
  const SHADS = { plat: 'none', doux: '0 2px 10px rgba(0,0,0,.06)', prononce: '0 12px 26px rgba(0,0,0,.18)' };
  const radii = RADII[theme.radius];
  const shadow = SHADS[theme.shadow];
  const border = theme.contrast
    ? (theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.30)')
    : (theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)');
  return { radCard: radii.card, radBtn: radii.btn, shadow, border, scale: theme.scale };
}
