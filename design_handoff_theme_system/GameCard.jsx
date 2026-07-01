// GameCard.jsx
import React from 'react';
import { useTheme, useThemeTokens } from '../../store/useTheme';

export default function GameCard({
  children, highlighted = false, accent = 'primary',
  padding = 16, style, onClick,
}) {
  const { theme } = useTheme();
  const { radCard, shadow, border } = useThemeTokens();
  const c = theme.colors;

  const ACCENT_COLORS = {
    primary: c.primary, accent: c.accent, success: c.success, danger: c.danger,
  };

  return (
    <div onClick={onClick} style={{
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
    }}>
      {children}
    </div>
  );
}
