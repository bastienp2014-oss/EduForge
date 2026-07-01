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

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { useProgression } from '../store/useProgression';
import { useAppConfig } from '../store/useAppConfig';
import { useCurrency } from '../hooks/useCurrency';
import * as LucideIcons from 'lucide-react';
import { useTenant } from '../store/useTenant';

// Écrans qui affichent le shell (bottom nav + HUD global)
const HUB_SCREENS = ['/', '/ville', '/arcade', '/portefeuille', '/store', '/leaderboard', '/dictionnaire'];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme((state) => state.theme);
  const tokens = useThemeTokens();
  const piasses = useProgression((state) => state.piasses);
  const getNiveau = useProgression((state) => state.getNiveau);
  const navItems = useAppConfig((state) => state.navItems);
  const appName = useAppConfig((state) => state.appName);
  const { format, symbol } = useCurrency();
  const currentTenant = useTenant((state) => state.currentTenant);
  
  const c            = theme.colors;
  const isHub        = HUB_SCREENS.includes(location.pathname);
  const niveau       = getNiveau();
  
  const enabledNavItems = navItems.filter(item => item.enabled);

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
            {appName}
          </span>

          {/* Piasses */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 999, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{symbol}</span>
            <span style={{
              fontFamily: theme.fonts.display, fontWeight: 700,
              fontSize: 13, color: c.gold,
            }}>
              {format(piasses).replace(symbol, '').trim()}
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
          {enabledNavItems.map(item => {
            const targetPath = item.id === 'home' ? '/' : `/${item.id}`;
            const isArcadeGame = location.pathname.startsWith('/game/') || ['/blocs', '/quiz', '/swipe', '/sort', '/2048', '/pendu', '/hache'].includes(location.pathname);
            const active = location.pathname === targetPath || (item.id === 'arcade' && isArcadeGame);
            
            const IconComp = (LucideIcons as any)[item.iconName] || LucideIcons.HelpCircle;
            return (
              <button
                key={item.id}
                onClick={() => navigate(targetPath)}
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

// End of AppShell.tsx