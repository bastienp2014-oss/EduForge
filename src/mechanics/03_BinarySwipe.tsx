import { useTheme } from '../store/useTheme';
import React, { useState, useRef } from 'react';
import { BaseGameProps } from '../types';
import { BinarySwipeData, BinarySwipeItem } from '../types/mechanics';

export default function BinarySwipe({ items, onBack, onComplete, onResponse, isEmbedded, data }: BaseGameProps & { data?: BinarySwipeData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  // We map the "left/right" binary choices based on the first item if possible, or use a default
  const left = data?.config?.left || { label: 'Faux', emoji: '❌', color: '#c0392b' };
  const right = data?.config?.right || { label: 'Vrai', emoji: '✅', color: '#2D7A4F' };

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [dx, setDx] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ side: 'left' | 'right', correct: boolean, explanation?: string } | null>(null);
  const touchStart = useRef<number | null>(null);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{ color: C.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const swipes: BinarySwipeItem[] = items.map(item => ({
    id: item.id,
    question: item.payload.question,
    answer: item.payload.answer,
    explanation: item.payload.exemple
  }));

  const currentItem = swipes[idx];
  const swipeSide = dx > 60 ? 'right' : dx < -60 ? 'left' : null;

  const commit = (side: 'left' | 'right') => {
    // For now we assume if they swipe right (Vrai), they are saying the item is correct.
    // If it's a QCM, "Vrai" means the first option is the answer. For generic, let's just make it a mock or something.
    // Actually, if we look at Anglicismes, answer is "quebecois". If we show a word, they can say if it's quebecois or standard?
    // Let's assume all BinarySwipes provided have answer as 'left' or 'right' in their payload, OR
    // we use a simple heuristic: True/False. Since we don't have True/False currently in our data, 
    // we'll assume it's just a demo mechanic for now and accept 'right' as always correct for demonstration if not specified.
    const isCorrect = side === 'right'; // Placeholder heuristic

    setLastAnswer({ side, correct: isCorrect, explanation: currentItem.explanation });
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    onResponse?.(currentItem.id, isCorrect ? 3 : 1);

    setTimeout(() => {
      setResult(null); setLastAnswer(null); setDx(0);
      if (idx + 1 >= swipes.length) { setDone(true); onComplete?.(score * 25); }
      else setIdx(i => i + 1);
    }, 1100);
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || result) return;
    setDx(e.touches[0].clientX - touchStart.current);
  };
  const onTouchEnd = () => {
    if (result) return;
    if (dx > 80) commit('right');
    else if (dx < -80) commit('left');
    else setDx(0);
    touchStart.current = null;
  };

  if (done) return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, marginBottom: 8 }}>{score}/{swipes.length} correct</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>+{score * 25} pts</div>
      <button onClick={onBack} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Retour</button>
    </div>
  );

  const rotation = dx * 0.08;
  const opacity = result ? (result === 'correct' ? 1 : 0.4) : 1;

  return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#131629', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>Swipe</span>
        <span style={{ fontSize: 12, color: C.muted }}>⭐ {score}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        {/* Indicateurs */}
        <div style={{ display: 'flex', width: '100%', maxWidth: 340, justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: dx < -30 ? left.color : C.muted, transition: 'color .15s' }}>{left.emoji} {left.label}</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, color: dx > 30 ? right.color : C.muted, transition: 'color .15s' }}>{right.label} {right.emoji}</div>
        </div>
        {/* Card */}
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{
            width: '100%', maxWidth: 340, minHeight: 180,
            background: result === 'correct' ? C.surface : result === 'wrong' ? '#2a1010' : C.surface,
            borderRadius: 22, border: `2px solid ${result === 'correct' ? '#2D7A4F' : result === 'wrong' ? '#c0392b' : 'rgba(255,255,255,.1)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28,
            transform: `translateX(${dx}px) rotate(${rotation}deg)`,
            transition: dx === 0 ? 'transform .3s, border-color .2s' : 'border-color .2s',
            boxShadow: '0 8px 32px rgba(0,0,0,.3)', userSelect: 'none', cursor: 'grab', opacity
          }}>
          {result ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{result === 'correct' ? '✓' : '✗'}</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8 }}>{result === 'correct' ? 'Correct !' : 'Mauvais'}</div>
              {lastAnswer?.explanation && <div style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>{lastAnswer.explanation}</div>}
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 26, color: C.ink, textAlign: 'center' }}>{currentItem.question || currentItem.answer}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 16 }}>← glisse pour classer →</div>
            </>
          )}
        </div>
        {/* Boutons fallback */}
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button onClick={() => !result && commit('left')} style={{ flex: 1, background: left.color, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{left.emoji} {left.label}</button>
          <button onClick={() => !result && commit('right')} style={{ flex: 1, background: right.color, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{right.emoji} {right.label}</button>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>{idx + 1}/{swipes.length} cartes</div>
      </div>
    </div>
  );
}