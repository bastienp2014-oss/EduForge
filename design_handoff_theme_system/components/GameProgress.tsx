/**
 * GameProgress — Barre de progression / vies standard
 *
 * Affiche une combinaison configurable de :
 *   - Barre de progression (current / total)
 *   - Cœurs (vies)
 *   - Score textuel
 *
 * Usage :
 *   <GameProgress lives={3} maxLives={3} score={320} current={2} total={5} />
 *   <GameProgress lives={2} maxLives={3} />           // sans barre
 *   <GameProgress current={3} total={10} showBar />   // sans vies
 */

import React from 'react';
import { useTheme, useThemeTokens } from '../../store/useTheme';

interface GameProgressProps {
  /** Vies restantes */
  lives?: number;
  maxLives?: number;
  /** Score actuel (affiché à droite) */
  score?: number;
  /** Progression (pour la barre) */
  current?: number;
  total?: number;
  showBar?: boolean;
}

export default function GameProgress({
  lives, maxLives = 3, score, current, total, showBar = true,
}: GameProgressProps) {
  const { theme } = useTheme();
  const { border, shadow } = useThemeTokens();
  const c = theme.colors;

  const pct = (showBar && current != null && total) ? Math.min(current / total, 1) : null;

  return (
    <div style={{
      background: c.surface,
      borderBottom: `1px solid ${border}`,
      padding: '8px 16px',
    }}>
      {pct !== null && (
        <div style={{
          background: border,
          borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: 5,
        }}>
          <div style={{
            width: `${pct * 100}%`, height: '100%',
            background: c.primary, borderRadius: 99,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Vies */}
        {lives != null && (
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <span key={i} style={{ fontSize: 13, opacity: i < lives ? 1 : 0.25 }}>❤️</span>
            ))}
          </div>
        )}
        {/* Progression textuelle */}
        {current != null && total != null && (
          <span style={{
            fontFamily: theme.fonts.body,
            fontSize: `${11 * theme.scale}px`,
            color: c.muted, fontWeight: 600,
          }}>
            {current} / {total}
          </span>
        )}
        {/* Score */}
        {score != null && (
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: `${12 * theme.scale}px`,
            color: c.primary, fontWeight: 700,
          }}>
            {score} XP
          </span>
        )}
      </div>
    </div>
  );
}
