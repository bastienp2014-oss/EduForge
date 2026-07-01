/**
 * tileColors.js — Dérivation de couleurs pour les tuiles 2048
 * Mots & Blocs
 *
 * USAGE dans Game2048Screen.jsx :
 *
 *   import { getTileColors } from '../../utils/tileColors';
 *   import { useTheme } from '../../store/useTheme';
 *
 *   const { theme } = useTheme();
 *   const tileColors = getTileColors(theme.colors.primary);
 *   // tileColors[0] = plus clair, tileColors[7] = plus saturé/sombre
 *
 *   // Remplacer getTileColor() hardcodé par :
 *   function getTileColor(val) {
 *     const hash = Array.from(val).reduce((acc, c) => acc + c.charCodeAt(0), 0);
 *     return tileColors[hash % tileColors.length];
 *   }
 *
 * RÉSULTAT :
 *   8 couleurs hex dérivées de la couleur primaire du thème,
 *   du plus clair au plus saturé, avec légère variation de teinte.
 *   Le texte (clair/sombre) est aussi calculé automatiquement.
 */

// ─── Helpers HSL ──────────────────────────────────────────────────────────────

function hexToHSL(hex) {
  const h6 = (hex || '#888888').replace('#', '').slice(0, 6);
  let r = parseInt(h6.slice(0, 2), 16) / 255;
  let g = parseInt(h6.slice(2, 4), 16) / 255;
  let b = parseInt(h6.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return [0, 0.5, 0.5];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hh * 60, s, l];
}

function hslToHex(h, s, l) {
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 1);
  const ll = clamp(l, 0, 1);
  const a = ss * Math.min(ll, 1 - ll);
  const f = n => {
    const k = (n + hh / 30) % 12;
    const c = a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * clamp(ll - c, 0, 1)).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

// ─── API publique ──────────────────────────────────────────────────────────────

/**
 * Retourne un tableau de 8 couleurs hex dérivées de primaryHex.
 * @param {string} primaryHex - Ex: '#C75B39'
 * @returns {string[]} - 8 couleurs hex
 */
export function getTileColors(primaryHex) {
  try {
    const [h, s, l] = hexToHSL(primaryHex);
    return [
      hslToHex(h,  s * 0.35, Math.min(l + 0.32, 0.90)), // très clair
      hslToHex(h,  s * 0.50, Math.min(l + 0.22, 0.82)), // clair
      hslToHex(h,  s * 0.70, Math.min(l + 0.12, 0.74)), // moyen clair
      hslToHex(h,  s,        l),                          // primaire
      hslToHex(h,  Math.min(s * 1.1, 1), Math.max(l - 0.08, 0.12)), // primaire +
      hslToHex((h + 18) % 360, s, l),                    // teinte +18°
      hslToHex((h + 36) % 360, s * 0.85, Math.min(l + 0.08, 0.76)), // teinte +36°
      hslToHex((h - 20 + 360) % 360, s, Math.max(l - 0.04, 0.16)), // teinte -20°
    ];
  } catch (e) {
    return Array(8).fill('#888888');
  }
}

/**
 * Retourne la couleur de texte adaptée (blanc ou encre) selon la luminosité du fond.
 * @param {string} bgHex   - Couleur de fond de la tuile
 * @param {string} inkHex  - Couleur ink du thème (pour texte sombre)
 * @returns {string}       - '#ffffff' ou inkHex
 */
export function getTileTextColor(bgHex, inkHex = '#1a1a24') {
  try {
    const [, , l] = hexToHSL(bgHex);
    return l > 0.55 ? inkHex : '#ffffff';
  } catch (e) {
    return '#ffffff';
  }
}
