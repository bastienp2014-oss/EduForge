/**
 * GameButton — Bouton standard pour tous les jeux
 *
 * Variantes :
 *   primary   — Bouton principal (fond primary, texte blanc)
 *   secondary — Bouton secondaire (contour, fond surface)
 *   ghost     — Transparent, texte primary
 *   danger    — Fond danger (confirmation suppression, abandon)
 *   success   — Fond success (confirmation bonne réponse)
 *
 * Usage :
 *   <GameButton variant="primary" onPress={valider} size="lg">Valider</GameButton>
 *   <GameButton variant="secondary" onPress={aide}>Aide</GameButton>
 *   <GameButton variant="primary" onPress={fn} fullWidth>Rejouer</GameButton>
 */

import React from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size    = 'sm' | 'md' | 'lg';

interface GameButtonProps {
  key?: React.Key;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function GameButton({
  variant = 'primary', size = 'md', fullWidth = false,
  disabled = false, onPress, children, style,
}: GameButtonProps) {
  const { theme } = useTheme();
  const { radBtn, border } = useThemeTokens();
  const c = theme.colors;

  const BG: Record<Variant, string> = {
    primary:   c.primary,
    secondary: c.surface,
    ghost:     'transparent',
    danger:    c.danger,
    success:   c.success,
  };
  const FG: Record<Variant, string> = {
    primary:   '#fff',
    secondary: c.ink,
    ghost:     c.primary,
    danger:    '#fff',
    success:   '#fff',
  };
  const BORDER: Record<Variant, string> = {
    primary:   'none',
    secondary: `1px solid ${border}`,
    ghost:     'none',
    danger:    'none',
    success:   'none',
  };
  const PAD: Record<Size, string> = {
    sm: `7px 14px`, md: `11px 18px`, lg: `14px 22px`,
  };
  const FS: Record<Size, number> = { sm: 12, md: 13, lg: 15 };

  return (
    <button
      onClick={onPress}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : undefined,
        background: BG[variant],
        color: FG[variant],
        border: BORDER[variant],
        borderRadius: radBtn,
        padding: PAD[size],
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        fontSize: `${FS[size] * theme.scale}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
