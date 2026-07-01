// GameProgress.jsx
import React from 'react';
import { useTheme, useThemeTokens } from '../../store/useTheme';

export default function GameProgress({
  lives, maxLives = 3, score, current, total, showBar = true,
}) {
  const { theme } = useTheme();
  const { border } = useThemeTokens();
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
        {lives != null && (
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: maxLives }).map((_, i) => (
              <span key={i} style={{ fontSize: 13, opacity: i < lives ? 1 : 0.25 }}>❤️</span>
            ))}
          </div>
        )}
        {current != null && total != null && (
          <span style={{
            fontFamily: theme.fonts.body,
            fontSize: `${11 * theme.scale}px`,
            color: c.muted, fontWeight: 600,
          }}>{current} / {total}</span>
        )}
        {score != null && (
          <span style={{
            fontFamily: theme.fonts.display,
            fontSize: `${12 * theme.scale}px`,
            color: c.primary, fontWeight: 700,
          }}>{score} XP</span>
        )}
      </div>
    </div>
  );
}
