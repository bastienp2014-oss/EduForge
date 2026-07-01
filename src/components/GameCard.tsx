/**
 * GameCard — Carte / panneau standard
 *
 * Applique automatiquement : radius, shadow, border, surface du thème.
 * Utiliser pour toute surface (carte de mot, panneau d'options, indice…).
 *
 * Usage :
 *   <GameCard>
 *     <p>Contenu</p>
 *   </GameCard>
 *
 *   <GameCard highlighted accent="primary">
 *     <p>Carte sélectionnée</p>
 *   </GameCard>
 */

import React from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';

type AccentColor = 'primary' | 'accent' | 'success' | 'danger';

interface GameCardProps {
  children: React.ReactNode;
  /** Affiche un contour coloré */
  highlighted?: boolean;
  accent?: AccentColor;
  /** Padding interne (défaut: 16px) */
  padding?: number | string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function GameCard({
  children, highlighted = false, accent = 'primary',
  padding = 16, style, onClick,
}: GameCardProps) {
  const { theme } = useTheme();
  const { radCard, shadow, border } = useThemeTokens();
  const c = theme.colors;

  const ACCENT_COLORS: Record<AccentColor, string> = {
    primary: c.primary, accent: c.accent, success: c.success, danger: c.danger,
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: c.surface,
        borderRadius: radCard,
        boxShadow: shadow,
        border: highlighted
          ? `2px solid ${ACCENT_COLORS[accent]}`
          : `1px solid ${border}`,
        padding,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
