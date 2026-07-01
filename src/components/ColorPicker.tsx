import React, { useRef, useEffect } from 'react';
import { Pipette } from 'lucide-react';
import { useTheme, useThemeTokens } from '../store/useTheme';

interface ColorPickerProps {
  label: string;
  swatches: string[];
  value: string;
  onChange: (hex: string) => void;
}

export default function ColorPicker({ label, swatches, value, onChange }: ColorPickerProps) {
  const { theme } = useTheme();
  const tokens = useThemeTokens();
  const c = theme.colors;
  const colorInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Keep input value in sync when prop changes
  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.value = value;
    }
    if (colorInputRef.current) {
      colorInputRef.current.value = value;
    }
  }, [value]);

  const handleHexInput = (val: string) => {
    let cleanVal = val.trim();
    if (!cleanVal.startsWith('#')) {
      cleanVal = '#' + cleanVal;
    }
    if (/^#[0-9a-fA-F]{6}$/.test(cleanVal)) {
      onChange(cleanVal);
    }
  };

  const handleEyedropper = async () => {
    // Check if browser supports EyeDropper API
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
      } catch (err) {
        // User cancelled or error occurred
        console.log('EyeDropper cancelled or failed', err);
      }
    } else {
      // Fallback: trigger click on the hidden color picker input
      if (colorInputRef.current) {
        colorInputRef.current.click();
      }
    }
  };

  return (
    <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      {/* Label */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>

      {/* Swatches Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 8 }}>
        {swatches.map(color => {
          const isSelected = value.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              title={color}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                background: color,
                border: isSelected ? `3px solid ${c.ink}` : '3px solid transparent',
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,.3)' : '0 1px 3px rgba(0,0,0,.15)',
                transition: 'all 0.15s ease-in-out',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          );
        })}
      </div>

      {/* Hex Text and Pickers row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Native Color Input Preview */}
        <div style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', border: `2px solid ${tokens.border}`, overflow: 'hidden', flexShrink: 0 }}>
          <input
            ref={colorInputRef}
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              position: 'absolute',
              top: -8,
              left: -8,
              width: 50,
              height: 50,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: 'none'
            }}
          />
        </div>

        {/* Text Field */}
        <input
          ref={textInputRef}
          type="text"
          placeholder={value}
          defaultValue={value}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleHexInput(e.currentTarget.value);
              e.currentTarget.blur();
            }
          }}
          onBlur={e => handleHexInput(e.target.value)}
          style={{
            flex: 1,
            border: `1px solid ${tokens.border}`,
            borderRadius: 9,
            padding: '7px 10px',
            fontSize: 12,
            fontFamily: 'monospace',
            color: c.ink,
            background: c.surface,
          }}
        />

        {/* Pipette Button */}
        <button
          onClick={handleEyedropper}
          title={window.EyeDropper ? "Pipette — sélectionner une couleur sur l'écran" : "Sélecteur de couleur"}
          style={{
            width: 34,
            height: 34,
            border: `1px solid ${tokens.border}`,
            borderRadius: 9,
            background: c.surface,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            color: c.ink,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = c.surface;
          }}
        >
          <Pipette size={16} />
        </button>
      </div>
    </div>
  );
}

// Add global window type extension for EyeDropper API
declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}
