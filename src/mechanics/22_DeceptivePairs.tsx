import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { DeceptivePairsData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function DeceptivePairs({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: DeceptivePairsData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { config = {}, pairs = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  type PairItem = NonNullable<DeceptivePairsData['pairs']>[number];
  type ChoiceItem = NonNullable<PairItem['choices']>[number];

  const pair = pairs[idx];
  const answered = picked !== null;

  const pick = useCallback((choice: ChoiceItem) => {
    if (answered || !pair) return;
    setPicked(choice.id);
    if (choice.correct) setScore(s=>s+35);
    if (pair.itemId && onResponse) {
       onResponse(pair.itemId, choice.correct ? 5 : 1);
    }
  }, [answered, pair, onResponse]);

  const next = () => {
    if (idx+1 >= pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Faux amis démasqués !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!pair) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">🤥</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucune paire disponible
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
          Faux Amis
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {idx+1}/{pairs.length}
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Mot + contexte A */}
        <div 
          className="p-6 border flex flex-col gap-3"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            boxShadow: shadow
          }}
        >
          <div className="font-extrabold text-[26px]" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {pair.term}
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(43,90,160,.25)', color: '#93c5fd' }}>
              {config?.contextA}
            </div>
          </div>
          <div className="text-sm leading-relaxed italic" style={{ color: theme.colors.muted }}>
            "{pair.meaningA}"
          </div>
        </div>

        {/* Question */}
        <div className="text-[13px] font-bold text-center px-4" style={{ color: theme.colors.primary }}>
          Que signifie <strong className="font-extrabold">"{pair.term}"</strong> en <span className="px-2 py-0.5 rounded ml-1" style={{ backgroundColor: `${theme.colors.primary}33` }}>{config?.contextB}</span> ?
        </div>

        {/* Choix */}
        <div className="flex flex-col gap-3">
          {pair.choices.map((c) => {
            const isCorrect = answered && c.correct;
            const isWrong = answered && c.id===picked && !c.correct;
            return (
              <button 
                key={c.id} 
                onClick={() => pick(c)} 
                className={`flex items-center gap-3 p-4 text-left border-2 font-semibold text-sm transition-all ${answered ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                style={{
                  backgroundColor: isCorrect ? `${theme.colors.success}33` : isWrong ? `${theme.colors.danger}26` : theme.colors.surface,
                  borderColor: isCorrect ? theme.colors.success : isWrong ? theme.colors.danger : border,
                  borderRadius: radBtn, 
                  fontFamily: theme.fonts.display, 
                  color: theme.colors.ink, 
                }}
              >
                {c.isMeaningA && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: 'rgba(99,102,241,.2)', color: '#a5b4fc' }}>
                    ⚠️ Piège
                  </span>
                )}
                <span>{isCorrect ? '✓ ' : isWrong ? '✗ ' : ''}{c.text}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="flex flex-col gap-4 mt-2 animate-in slide-in-from-bottom-2">
            <div 
              className="p-4 border"
              style={{ 
                backgroundColor: `${theme.colors.ink}0a`, 
                borderRadius: radCard, 
                borderColor: border 
              }}
            >
              <div className="text-xs leading-relaxed mb-1.5" style={{ color: theme.colors.muted }}>
                💡 {pair.explanation}
              </div>
              {pair.etymology && (
                <div className="text-[11px] italic opacity-60" style={{ color: theme.colors.muted }}>
                  📜 {pair.etymology}
                </div>
              )}
            </div>
            <button 
              onClick={next} 
              className="w-full py-4 border-none font-bold text-[15px] cursor-pointer transition-transform active:scale-95"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {idx+1<pairs.length ? 'Paire suivante →' : 'Voir résultats'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}