/**
 * GameHUD — Header universel de tous les jeux
 *
 * RÈGLE : Ce composant NE DOIT PAS être redessiné jeu par jeu.
 * C'est le repère spatial de l'utilisateur dans l'app.
 *
 * Usage :
 *   <GameHUD title="Hache" onBack={onBack} />
 *   <GameHUD title="Pendu" onBack={onBack} extra={<span>🔥 3</span>} />
 */

import React, { useState } from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import { useTheme } from '../store/useTheme';
import { useProgression } from '../store/useProgression';
import { useCurrency } from '../hooks/useCurrency';
import { useAppConfig } from '../store/useAppConfig';
import AITutorChat from './AITutorChat';

interface GameHUDProps {
  title: string;
  onBack: () => void;
  onHelp?: () => void;
  /** Élément optionnel à droite du titre (ex: streak) */
  extra?: React.ReactNode;
}

export default function GameHUD({ title, onBack, onHelp, extra }: GameHUDProps) {
  const { theme } = useTheme();
  const piasses = useProgression(s => s.piasses);
  const { format, symbol } = useCurrency();
  const { features } = useAppConfig();
  const c = theme.colors;
  
  const [showTutor, setShowTutor] = useState(false);

  return (
    <>
    <div
      style={{
        background: c.header,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Bouton retour */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.16)',
            border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            flexShrink: 0,
          }}
          aria-label="Retour"
        >
          <ArrowLeft size={18} color="#fff" />
        </button>
        {onHelp && (
          <button
            onClick={onHelp}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.16)',
              border: 'none', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
              color: '#fff',
              fontWeight: 'bold'
            }}
            aria-label="Aide"
          >
            ?
          </button>
        )}
      </div>

      {/* Titre + extra */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
        <span style={{
          fontFamily: theme.fonts.display,
          fontWeight: 700,
          fontSize: `${15 * theme.scale}px`,
          color: '#fff',
          letterSpacing: '0.02em',
        }}>
          {title}
        </span>
        {extra && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{extra}</span>}
      </div>

      {/* Jeton piasses & AI Tutor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {features.enableAiGenerator && (
          <button
            onClick={() => setShowTutor(true)}
            style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.16)',
              border: 'none', cursor: 'pointer',
              display: 'grid', placeItems: 'center',
              flexShrink: 0,
              color: '#fff'
            }}
            title="Assistant IA"
          >
            <Bot size={18} />
          </button>
        )}
        <div style={{
          background: 'rgba(255,255,255,0.16)',
          borderRadius: 999,
          padding: '5px 11px',
          display: 'flex', alignItems: 'center', gap: 5,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{symbol}</span>
          <span style={{
            fontFamily: theme.fonts.display,
            fontWeight: 700,
            fontSize: 13,
            color: c.gold,
          }}>
            {format(piasses).replace(symbol, '').trim()}
          </span>
        </div>
      </div>
    </div>
    
    {showTutor && (
      <AITutorChat 
        onClose={() => setShowTutor(false)} 
        gameContext={`L'utilisateur est actuellement dans l'écran ou le jeu: ${title}. Aide-le en lien avec cette activité.`}
      />
    )}
    </>
  );
}
