import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useCallback, ReactNode } from 'react';

import { BaseGameProps } from '../types';
import { ClozeTestData } from '../types/mechanics';

import { shuffle } from '../utils/array';

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
  C: AppColors
): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  const regex = /\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <span key={last} style={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
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
        style={{
          display: 'inline-block',
          minWidth: 90,
          borderBottom: filled ? 'none' : '2px solid rgba(255,255,255,.3)',
          background: filled ? (answered ? (correct ? 'rgba(45,122,79,.25)' : 'rgba(192,57,43,.2)') : 'rgba(199,91,57,.15)') : 'transparent',
          borderRadius: filled ? 6 : 0,
          padding: filled ? '1px 8px' : '1px 4px',
          color: answered ? (correct ? '#4ade80' : wrong ? '#f87171' : C.ink) : C.primary,
          fontWeight: 700,
          fontSize: 14,
          cursor: filled && !answered ? 'pointer' : 'default',
          margin: '0 2px'
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
      <span key="end" style={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>
        {text.slice(last)}
      </span>
    );
  }
  
  return parts;
}

// TODO: Refactor ClozeTest to fully use items instead of data
export default function ClozeTest({ data, items, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: ClozeTestData }) {
  const { theme } = useTheme();
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

  if (done) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📝</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, marginBottom: 8 }}>Exercices terminés !</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Retour</button>
    </div>
  );

  if (!ex) return null;

  const usedWords = Object.values(fills);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#131629', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>Texte à trous</span>
        <span style={{ fontSize: 12, color: C.muted }}>{exIdx + 1}/{exercises.length}</span>
      </div>
      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Texte */}
        <div style={{ background: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, lineHeight: 2, fontSize: 15 }}>
          {parseText(ex.text, ex.blanks, fills, clearBlank, answered, C)}
        </div>
        {/* Banque de mots */}
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Banque de mots</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {wordBank.map((w: string) => {
              const used = usedWords.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => !used && !answered && pick(w)}
                  style={{
                    background: used ? 'rgba(255,255,255,.04)' : C.surface,
                    color: used ? C.muted : C.ink,
                    border: `1px solid ${used ? C.border : C.primary}`,
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontFamily: 'Sora,sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: used || answered ? 'default' : 'pointer',
                    opacity: used ? 0.5 : 1,
                    textDecoration: used ? 'line-through' : 'none'
                  }}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
        {!answered ? (
          <button onClick={validate} disabled={!allFilled} style={{ background: allFilled ? C.primary : 'rgba(255,255,255,.08)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: allFilled ? 'pointer' : 'default' }}>Valider</button>
        ) : (
          <button onClick={next} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            {exIdx + 1 < exercises.length ? 'Exercice suivant →' : 'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}
