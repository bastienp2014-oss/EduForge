import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { ErrorCorrectionData } from '../types/mechanics';
import GameResult from '../components/GameResult';

type ErrorItem = NonNullable<NonNullable<ErrorCorrectionData['exercises']>[number]['errors']>[number];

function renderText(text: string, errors: ErrorItem[], found: string[], onTap: (err: ErrorItem) => void, themeTokens: any) {
  const { radCard } = themeTokens;
  const sorted = [...errors].sort((a,b)=>a.start-b.start);
  const parts = [];
  let last = 0;
  sorted.forEach(err => {
    if (err.start > last) parts.push(<span key={last} className="opacity-80 leading-relaxed">{text.slice(last,err.start)}</span>);
    const isFound = found.includes(err.id);
    parts.push(
      <span 
        key={err.id} 
        onClick={() => !isFound && onTap(err)} 
        className={`px-1 py-0.5 rounded transition-colors ${isFound ? 'cursor-default no-underline' : 'cursor-pointer active:scale-95'}`}
        style={{
          backgroundColor: isFound ? 'rgba(45,122,79,.25)' : 'rgba(255,220,100,.12)',
          color: isFound ? '#4ade80' : '#fde68a',
          borderRadius: radCard ? 4 : 4,
          textDecoration: isFound ? 'none' : 'underline dotted',
          fontWeight: 700,
          fontSize: 14
        }}
      >
        {isFound ? err.correct : err.wrong}
      </span>
    );
    last = err.end;
  });
  if (last < text.length) parts.push(<span key='end' className="opacity-80 leading-relaxed">{text.slice(last)}</span>);
  return parts;
}

export default function ErrorCorrection({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: ErrorCorrectionData }) {
  const { theme } = useTheme();
  const tokens = useThemeTokens();
  const { border, radCard, radBtn, shadow } = tokens;

  const { config = {}, exercises = [] } = data || {};

  const [exIdx, setExIdx] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<ErrorItem | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showExpl, setShowExpl] = useState<ErrorItem | null>(null);

  const ex = exercises[exIdx];
  const allFound = ex?.errors?.every((e) => found.includes(e.id));

  const tapError = useCallback((err: ErrorItem) => {
    setSelected(err);
  }, []);

  const confirm = (err: ErrorItem) => {
    const newFound = [...found, err.id];
    setFound(newFound);
    setScore(s => s+30);
    setShowExpl(err);
    setSelected(null);
    if (ex?.itemId && onResponse) {
       onResponse(ex.itemId, 5);
    }
  };

  const next = () => {
    setShowExpl(null);
    if (exIdx+1 >= exercises.length) { setDone(true); onComplete?.(score); }
    else { setExIdx(i=>i+1); setFound([]); setSelected(null); }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Corrections terminées !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!ex) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">🔎</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucun exercice disponible
      </div>
      <button 
        onClick={onBack} 
        className="mt-6 px-8 py-3 rounded-xl border-none font-bold text-sm cursor-pointer"
        style={{ backgroundColor: theme.colors.primary, color: '#fff', fontFamily: theme.fonts.display }}
      >
        Retour
      </button>
    </div>
  );

  return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col`} style={{ backgroundColor: theme.colors.bg }}>
      {/* HUD */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          backgroundColor: theme.colors.header, 
          borderColor: border 
        }}
      >
        <button 
          onClick={onBack} 
          className="rounded-lg px-3 py-1.5 text-base cursor-pointer"
          style={{ backgroundColor: border, color: theme.colors.ink }}
        >
          ←
        </button>
        <span className="font-bold text-sm" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
          Correction
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {found.length}/{ex.errors.length} erreur{ex.errors.length>1?'s':''}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {config?.showErrorCount && (
          <div 
            className="p-3 text-xs border"
            style={{ 
              backgroundColor: 'rgba(255,220,100,.08)', 
              borderRadius: radCard, 
              borderColor: 'rgba(255,220,100,.2)',
              color: '#fde68a'
            }}
          >
            ⚠️ Ce texte contient <strong className="font-bold">{ex.errors.length} erreur{ex.errors.length>1?'s':''}</strong>. Tape sur les mots surlignés pour les corriger.
          </div>
        )}

        <div 
          className="p-5 text-sm leading-loose border"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            color: theme.colors.ink,
            boxShadow: shadow
          }}
        >
          {renderText(ex.text, ex.errors, found, tapError, tokens)}
        </div>

        {selected && (
          <div 
            className="p-4 border animate-in zoom-in-95"
            style={{ 
              backgroundColor: `${theme.colors.ink}0a`, 
              borderRadius: radCard, 
              borderColor: theme.colors.primary 
            }}
          >
            <div className="text-xs mb-3" style={{ color: theme.colors.muted }}>
              Corriger <strong className="font-bold" style={{ color: theme.colors.ink }}>"{selected.wrong}"</strong> par :
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => confirm(selected)} 
                className="px-5 py-2.5 rounded-lg border-none font-bold text-sm cursor-pointer transition-transform active:scale-95 flex-1"
                style={{ backgroundColor: theme.colors.success, color: '#fff', fontFamily: theme.fonts.display }}
              >
                ✓ {selected.correct}
              </button>
              <button 
                onClick={() => setSelected(null)} 
                className="px-4 py-2.5 rounded-lg border-none font-bold text-sm cursor-pointer transition-colors"
                style={{ backgroundColor: `${theme.colors.ink}14`, color: theme.colors.muted, fontFamily: theme.fonts.display }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {showExpl && (
          <div 
            className="p-4 border animate-in slide-in-from-bottom-2"
            style={{ 
              backgroundColor: `${theme.colors.success}1a`, 
              borderRadius: radCard, 
              borderColor: theme.colors.success 
            }}
          >
            <div className="font-bold text-sm mb-1.5" style={{ fontFamily: theme.fonts.display, color: theme.colors.success }}>
              ✓ Bonne correction !
            </div>
            <div className="text-xs leading-relaxed" style={{ color: theme.colors.muted }}>
              {showExpl.explanation}
            </div>
            <button 
              onClick={() => setShowExpl(null)} 
              className="mt-3 px-3.5 py-1.5 rounded-md border-none text-xs cursor-pointer transition-colors"
              style={{ backgroundColor: `${theme.colors.ink}14`, color: theme.colors.muted }}
            >
              OK
            </button>
          </div>
        )}

        {allFound && !showExpl && (
          <div className="mt-auto pt-4 animate-in fade-in">
            <button 
              onClick={next} 
              className="w-full py-3.5 border-none font-bold text-[15px] transition-transform active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {exIdx+1<exercises.length ? 'Exercice suivant →' : 'Voir résultats'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}