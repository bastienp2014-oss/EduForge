// GameHUD.jsx — Header universel de tous les jeux
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../../store/useTheme';
import { useProgression } from '../../store/useProgression';

export default function GameHUD({ title, onBack, extra }) {
  const { theme } = useTheme();
  const { piasses } = useProgression();
  const c = theme.colors;

  return (
    <div style={{
      background: c.header,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexShrink: 0,
    }}>
      <button onClick={onBack} style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(255,255,255,0.16)',
        border: 'none', cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        flexShrink: 0,
      }} aria-label="Retour">
        <ArrowLeft size={18} color="#fff" />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
        <span style={{
          fontFamily: theme.fonts.display,
          fontWeight: 700,
          fontSize: `${15 * theme.scale}px`,
          color: '#fff',
          letterSpacing: '0.02em',
        }}>{title}</span>
        {extra && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{extra}</span>}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.16)',
        borderRadius: 999,
        padding: '5px 11px',
        display: 'flex', alignItems: 'center', gap: 5,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>⚜️</span>
        <span style={{
          fontFamily: theme.fonts.display,
          fontWeight: 700,
          fontSize: 13,
          color: c.gold,
        }}>{Math.floor(piasses)}</span>
      </div>
    </div>
  );
}
