import React, { useState, useCallback, ReactNode } from 'react';
import { useTheme, useThemeTokens, AppColors } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { ClozeTestData } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

type Exercise = ClozeTestData['exercises'][number];
type Blank = Exercise['blanks'][number];

function buildWordBank(exercises: ClozeTestData['exercises']): string[] {
  const all = exercises.flatMap(ex => ex.blanks.map((b: Blank) => b.answer));
  return shuffle([...new Set(all)]);
}

function parseText(
  text: string,
  blanks: Blank[],
  fills: Record<string, string>,
  onPick: (bid: string, val: string | null) => void,
  answered: boolean,
  C: AppColors,
  radBtn: number | string
): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  const regex = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={last} className="leading-relaxed" style={{ color: C.ink, opacity: 0.85 }}>
          {text.slice(last, m.index)}
        </span>
      );
    }
    
    const bid = m[1];
    const blank = blanks.find(b => b.id === bid);
    const filled = fills[bid];
    const correct = answered && blank && (filled === blank.answer || (blank.alternatives || []).includes(filled));
    const wrong = answered && filled && !correct;
    
    parts.push(
      <span
        key={bid}
        className="inline-block min-w-[90px] font-bold text-sm mx-1 px-2 py-0.5 text-center transition-all duration-200"
        style={{
          borderBottom: filled ? 'none' : `2px solid ${C.muted}`,
          backgroundColor: filled ? (answered ? (correct ? `${C.success}30` : `${C.danger}30`) : `${C.primary}20`) : 'transparent',
          borderRadius: filled ? radBtn : 0,
          color: answered ? (correct ? C.success : wrong ? C.danger : C.ink) : C.primary,
          cursor: filled && !answered ? 'pointer' : 'default',
        }}
        onClick={() => !answered && filled && onPick(bid, null)}
      >
        {filled || '___'}
      </span>
    );
    last = m.index + m[0].length;
  }
  
  if (last < text.length) {
    parts.push(
      <span key="end" className="leading-relaxed" style={{ color: C.ink, opacity: 0.85 }}>
        {text.slice(last)}
      </span>
    );
  }
  
  return parts;
}

export default function ClozeTest({ data, items, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: ClozeTestData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const C: AppColors = theme.colors;

  const { exercises = [] } = data || {};

  const [exIdx, setExIdx] = useState<number>(0);
  const [fills, setFills] = useState<Record<string, string>>({});
  const [answered, setAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const [wordBank] = useState<string[]>(() => buildWordBank(exercises));

  const ex: Exercise | undefined = exercises[exIdx];
  const allFilled = ex?.blanks.every(b => fills[b.id]) ?? false;

  const pick = useCallback((word: string) => {
    if (answered || !ex) return;
    const firstEmpty = ex.blanks.find(b => !fills[b.id]);
    if (!firstEmpty) return;
    setFills(f => ({ ...f, [firstEmpty.id]: word }));
  }, [answered, ex, fills]);

  const clearBlank = useCallback((bid: string, val: string | null = null) => {
    if (answered) return;
    setFills(f => {
      const n = { ...f };
      delete n[bid];
      return n;
    });
  }, [answered]);

  const validate = () => {
    if (!ex) return;
    let pts = 0;
    ex.blanks.forEach(b => {
      const f = fills[b.id];
      if (f === b.answer || (b.alternatives || []).includes(f)) pts += 20;
    });
    setScore(s => s + pts);
    setAnswered(true);
  };

  const next = () => {
    if (exIdx + 1 >= exercises.length) {
      setDone(true);
      onComplete?.(score);
    } else {
      setExIdx(i => i + 1);
      setFills({});
      setAnswered(false);
    }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Exercices terminés !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!ex) return null;

  const usedWords = Object.values(fills);

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
          Texte à trous
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {exIdx + 1}/{exercises.length}
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Text Area */}
        <div 
          className="p-5 text-[15px]"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            boxShadow: shadow
          }}
        >
          {parseText(ex.text, ex.blanks, fills, clearBlank, answered, C, radBtn)}
        </div>

        {/* Word Bank */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
            Banque de mots
          </div>
          <div className="flex flex-wrap gap-2.5">
            {wordBank.map((w: string) => {
              const used = usedWords.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => !used && !answered && pick(w)}
                  className="px-3.5 py-1.5 font-bold text-xs transition-all active:scale-95 disabled:pointer-events-none"
                  style={{
                    backgroundColor: used ? `${theme.colors.surface}40` : theme.colors.surface,
                    color: used ? theme.colors.muted : theme.colors.ink,
                    border: `1px solid ${used ? 'transparent' : border}`,
                    borderRadius: 999,
                    fontFamily: theme.fonts.display,
                    cursor: used || answered ? 'default' : 'pointer',
                    opacity: used ? 0.5 : 1,
                    textDecoration: used ? 'line-through' : 'none',
                    boxShadow: !used ? shadow : 'none'
                  }}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4">
          {!answered ? (
            <button 
              onClick={validate} 
              disabled={!allFilled} 
              className="w-full py-3.5 border-none font-bold text-[15px] transition-transform disabled:opacity-50"
              style={{ 
                backgroundColor: allFilled ? theme.colors.primary : `${theme.colors.ink}10`, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display, 
                cursor: allFilled ? 'pointer' : 'default',
                transform: allFilled ? 'scale(1)' : 'scale(0.98)'
              }}
            >
              Valider
            </button>
          ) : (
            <button 
              onClick={next} 
              className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform animate-in slide-in-from-bottom-2"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {exIdx + 1 < exercises.length ? 'Exercice suivant →' : 'Voir résultats'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
