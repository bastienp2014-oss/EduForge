/**
 * AppShell.jsx — Shell de navigation persistant
 * Mots & Blocs
 *
 * INTÉGRATION dans App.tsx / App.jsx :
 *
 *   import AppShell from './components/AppShell';
 *
 *   // Remplacer le rendu racine par :
 *   <AppShell currentScreen={currentScreen} onNavigate={navigateTo}>
 *     {currentScreen === 'home'      && <HomeScreen />}
 *     {currentScreen === 'ville'     && <VilleScreen />}
 *     {currentScreen === 'depanneur' && <DepanneurScreen />}
 *     {currentScreen === 'profil'    && <ProfilScreen />}
 *     {currentScreen === 'pendu'     && <PenduScreen onBack={() => navigateTo('home')} />}
 *     {currentScreen === 'hache'     && <HacheScreen onBack={() => navigateTo('home')} />}
 *     {// ... autres jeux — ils ont leur propre GameHUD, pas de shell }
 *   </AppShell>
 *
 * COMPORTEMENT :
 *   - La bottom nav s'affiche UNIQUEMENT sur les écrans "hubs" (home, ville, depanneur, profil)
 *   - Elle se cache automatiquement dans les jeux et écrans secondaires
 *   - Le HUD global (piasses + niveau) s'affiche en haut sur les écrans hubs
 *   - Les jeux ont leur propre GameHUD — AppShell ne l'affiche pas sur ces écrans
 */

import React from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { useProgression } from '../store/useProgression';

// Écrans qui affichent le shell (bottom nav + HUD global)
const HUB_SCREENS = ['home', 'ville', 'depanneur', 'profil', 'store', 'leaderboard', 'portefeuille', 'dictionnaire', 'apparence'];

// Items de navigation
const NAV_ITEMS = [
  { id: 'home',      label: 'Accueil',  icon: HomeIcon },
  { id: 'ville',     label: 'Ville',    icon: VilleIcon },
  { id: 'depanneur', label: 'Jeux',     icon: JeuxIcon },
  { id: 'profil',    label: 'Profil',   icon: ProfilIcon },
];

export default function AppShell({ currentScreen, onNavigate, children }) {
  const { theme }    = useTheme();
  const tokens       = useThemeTokens();
  const { piasses, getNiveau } = useProgression();
  const c            = theme.colors;
  const isHub        = HUB_SCREENS.includes(currentScreen);
  const niveau       = getNiveau();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100svh', background: c.bg, overflow: 'hidden',
    }}>
      {/* ── HUD global (hubs seulement) ─────────────────────────── */}
      {isHub && (
        <div style={{
          background: c.header,
          padding: '10px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: 12,
        }}>
          {/* Niveau */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 999, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 13 }}>⭐</span>
            <span style={{
              fontFamily: theme.fonts.display, fontWeight: 700,
              fontSize: 12, color: '#fff',
            }}>Niveau {niveau}</span>
          </div>

          {/* Logo / titre */}
          <span style={{
            fontFamily: theme.fonts.display, fontWeight: 800,
            fontSize: 16, color: '#fff', letterSpacing: '0.01em', flex: 1, textAlign: 'center',
          }}>
            Mots & Blocs
          </span>

          {/* Piasses */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 999, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>⚜️</span>
            <span style={{
              fontFamily: theme.fonts.display, fontWeight: 700,
              fontSize: 13, color: c.gold,
            }}>
              {Math.floor(piasses)}
            </span>
          </div>
        </div>
      )}

      {/* ── Contenu principal ───────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* ── Bottom nav (hubs seulement) ─────────────────────────── */}
      {isHub && (
        <nav style={{
          background: c.surface,
          borderTop: `1px solid ${tokens.border}`,
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          flexShrink: 0,
        }}>
          {NAV_ITEMS.map(item => {
            const active = currentScreen === item.id
              || (item.id === 'depanneur' && ['arcade', 'blocs', 'quiz', 'swipe', 'sort', '2048'].includes(currentScreen));
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer',
                  background: 'none',
                  padding: '10px 0 6px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 3,
                }}
              >
                <div style={{
                  width: 36, height: 26, borderRadius: 13,
                  background: active ? c.primary + '22' : 'transparent',
                  display: 'grid', placeItems: 'center',
                  transition: 'background 0.2s',
                }}>
                  <IconComp color={active ? c.primary : c.muted} size={20} />
                </div>
                <span style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 10, fontWeight: active ? 700 : 500,
                  color: active ? c.primary : c.muted,
                  transition: 'color 0.2s',
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

function HomeIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function VilleIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="13" height="12"/><polygon points="2 9 12 2 22 9"/>
      <rect x="9" y="14" width="4" height="7"/><line x1="16" y1="9" x2="22" y2="9"/>
      <line x1="22" y1="9" x2="22" y2="21"/><line x1="16" y1="21" x2="22" y2="21"/>
    </svg>
  );
}

function JeuxIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4"/>
      <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
      <circle cx="15" cy="11" r="1" fill={color}/><circle cx="17" cy="13" r="1" fill={color}/>
    </svg>
  );
}

function ProfilIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
