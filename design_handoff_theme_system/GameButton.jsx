// GameButton.jsx
import React from 'react';
import { useTheme, useThemeTokens } from '../../store/useTheme';

export default function GameButton({
  variant = 'primary', size = 'md', fullWidth = false,
  disabled = false, onPress, children, style,
}) {
  const { theme } = useTheme();
  const { radBtn, border } = useThemeTokens();
  const c = theme.colors;

  const BG = {
    primary: c.primary, secondary: c.surface, ghost: 'transparent',
    danger: c.danger, success: c.success,
  };
  const FG = {
    primary: '#fff', secondary: c.ink, ghost: c.primary,
    danger: '#fff', success: '#fff',
  };
  const BORDER = {
    primary: 'none', secondary: `1px solid ${border}`, ghost: 'none',
    danger: 'none', success: 'none',
  };
  const PAD = { sm: `7px 14px`, md: `11px 18px`, lg: `14px 22px` };
  const FS = { sm: 12, md: 13, lg: 15 };

  return (
    <button onClick={onPress} disabled={disabled} style={{
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
    }}>
      {children}
    </button>
  );
}
