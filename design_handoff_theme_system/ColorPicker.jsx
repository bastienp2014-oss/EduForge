/**
 * ColorPicker.jsx — Sélecteur de couleur avec swatches, hex, color picker natif et pipette
 *
 * USAGE dans ApparenceScreen.jsx :
 *
 *   import ColorPicker from '../../components/ColorPicker';
 *
 *   <ColorPicker
 *     label="Couleur principale"
 *     swatches={['#C75B39','#2D7A4F','#2B5AA0','#7C3AED','#D946EF','#E8A020']}
 *     value={theme.colors.primary}
 *     onChange={(hex) => patchPersonal({ colors: { ...theme.colors, primary: hex } })}
 *   />
 *
 *   <ColorPicker
 *     label="Couleur d'accent"
 *     swatches={['#3E5C8A','#C75B39','#E05C2A','#EC4899','#06B6D4']}
 *     value={theme.colors.accent}
 *     onChange={(hex) => patchPersonal({ colors: { ...theme.colors, accent: hex } })}
 *   />
 */

import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';

export default function ColorPicker({ label, swatches = [], value, onChange }) {
  const { theme }  = useTheme();
  const tokens     = useThemeTokens();
  const c          = theme.colors;

  const [hexInput, setHexInput]         = useState(value || '');
  const [eyedropperSupported]           = useState(() => typeof window !== 'undefined' && !!window.EyeDropper);
  const colorInputRef                   = useRef(null);

  // ── Sync hex input quand value change depuis l'extérieur ──────────
  React.useEffect(() => {
    setHexInput(value || '');
  }, [value]);

  // ── Valider et propager une valeur hex ────────────────────────────
  const commit = useCallback((hex) => {
    const clean = hex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      onChange(clean);
    }
  }, [onChange]);

  // ── Pipette EyeDropper API ────────────────────────────────────────
  const openEyedropper = useCallback(async () => {
    if (!eyedropperSupported) return;
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      setHexInput(hex);
      onChange(hex);
    } catch (err) {
      // L'utilisateur a annulé — ne rien faire
    }
  }, [eyedropperSupported, onChange]);

  // ── Input color natif (roue chromatique) ─────────────────────────
  const handleColorInput = (e) => {
    const hex = e.target.value;
    setHexInput(hex);
    onChange(hex);
  };

  // ── Champ texte hex ───────────────────────────────────────────────
  const handleHexKeyDown = (e) => {
    if (e.key === 'Enter') commit(e.target.value);
  };
  const handleHexBlur = (e) => {
    commit(e.target.value);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Label */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: c.muted,
        letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10,
      }}>
        {label}
      </div>

      {/* Swatches */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        {swatches.map(color => (
          <button
            key={color}
            onClick={() => { onChange(color); setHexInput(color); }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              cursor: 'pointer', background: color,
              border: value === color
                ? '3px solid #1d1d24'
                : '3px solid transparent',
              boxShadow: '0 1px 4px rgba(0,0,0,.20)',
              padding: 0, flexShrink: 0,
              transition: 'border-color 0.15s, transform 0.1s',
              transform: value === color ? 'scale(1.12)' : 'scale(1)',
            }}
            aria-label={color}
          />
        ))}
      </div>

      {/* Ligne : color picker + hex input + pipette */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Color picker natif (roue chromatique) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={() => colorInputRef.current?.click()}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: value || '#888',
              border: `2px solid ${tokens.border}`,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,.15)',
            }}
          />
          <input
            ref={colorInputRef}
            type="color"
            value={value || '#000000'}
            onChange={handleColorInput}
            style={{
              position: 'absolute', opacity: 0,
              width: 1, height: 1, top: 0, left: 0,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Champ hex */}
        <input
          type="text"
          value={hexInput}
          onChange={e => setHexInput(e.target.value)}
          onKeyDown={handleHexKeyDown}
          onBlur={handleHexBlur}
          placeholder="#000000"
          maxLength={7}
          style={{
            flex: 1,
            border: `1px solid ${tokens.border}`,
            borderRadius: 10, padding: '9px 12px',
            fontSize: 13, fontFamily: 'monospace',
            color: c.ink, background: c.surface,
            outline: 'none',
          }}
        />

        {/* Bouton pipette */}
        <button
          onClick={openEyedropper}
          disabled={!eyedropperSupported}
          title={
            eyedropperSupported
              ? 'Pipette — sélectionne une couleur à l\'écran'
              : 'Pipette non supportée par ce navigateur'
          }
          style={{
            width: 40, height: 40, flexShrink: 0,
            border: `1px solid ${tokens.border}`,
            borderRadius: 10,
            background: c.surface,
            cursor: eyedropperSupported ? 'pointer' : 'not-allowed',
            opacity: eyedropperSupported ? 1 : 0.4,
            fontSize: 18,
            display: 'grid', placeItems: 'center',
          }}
          aria-label="Pipette"
        >
          🔬
        </button>
      </div>

      {/* Message si pipette non supportée */}
      {!eyedropperSupported && (
        <div style={{ fontSize: 10, color: c.muted, marginTop: 5, fontStyle: 'italic' }}>
          La pipette nécessite Chrome ou Edge.
        </div>
      )}
    </div>
  );
}
