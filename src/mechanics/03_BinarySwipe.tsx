import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { BinarySwipeData, BinarySwipeItem } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function BinarySwipe({ items, onBack, onComplete, onResponse, isEmbedded, data }: BaseGameProps & { data?: BinarySwipeData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const leftConfig = data?.config?.left || { label: 'Faux', emoji: '❌', color: theme.colors.danger };
  const rightConfig = data?.config?.right || { label: 'Vrai', emoji: '✅', color: theme.colors.success };

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [dx, setDx] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ side: 'left' | 'right', correct: boolean, explanation?: string } | null>(null);
  const touchStart = useRef<number | null>(null);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const swipes: BinarySwipeItem[] = items.map(item => ({
    id: item.id,
    question: item.payload.question || item.payload.translation || "Question",
    answer: item.payload.answer,
    explanation: item.payload.exemple
  }));

  const currentItem = swipes[idx];
  // Simple heuristic: if 'right' is 'Vrai', assume answer matches right for True, left for False.
  // In a real generic system, data should explicitly map to left/right ids. We'll fallback to right if missing.
  const correctAnswerSide = currentItem.answer === 'left' ? 'left' : 'right';

  const totalXP = score * 25;

  const commit = useCallback((side: 'left' | 'right') => {
    const isCorrect = side === correctAnswerSide;

    setLastAnswer({ side, correct: isCorrect, explanation: currentItem.explanation });
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    
    onResponse?.(currentItem.id, isCorrect ? 3 : 1);

    setTimeout(() => {
      setResult(null); 
      setLastAnswer(null); 
      setDx(0);
      if (idx + 1 >= swipes.length) { 
        setDone(true); 
        onComplete?.(totalXP); 
      } else {
        setIdx(i => i + 1);
      }
    }, 1100);
  }, [currentItem, idx, swipes.length, score, onComplete, onResponse, totalXP, correctAnswerSide]);

  const onTouchStart = (e: React.TouchEvent | React.MouseEvent) => { 
    touchStart.current = 'touches' in e ? e.touches[0].clientX : e.clientX; 
  };
  const onTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (touchStart.current === null || result) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDx(clientX - touchStart.current);
  };
  const onTouchEnd = () => {
    if (result || touchStart.current === null) return;
    if (dx > 80) commit('right');
    else if (dx < -80) commit('left');
    else setDx(0);
    touchStart.current = null;
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title={`${score}/${swipes.length} corrects`}
        points={totalXP}
        onBack={onBack}
      />
    );
  }

  const rotation = dx * 0.08;
  const opacity = result ? (result === 'correct' ? 1 : 0.4) : 1;

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
          Swipe
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.primary }}>
          ⭐ {score}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 overflow-hidden">
        {/* Indicators */}
        <div className="flex w-full max-w-sm justify-between px-4">
          <div 
            className="font-bold text-[13px] transition-colors"
            style={{ 
              fontFamily: theme.fonts.display, 
              color: dx < -30 ? leftConfig.color : theme.colors.muted 
            }}
          >
            {leftConfig.emoji} {leftConfig.label}
          </div>
          <div 
            className="font-bold text-[13px] transition-colors"
            style={{ 
              fontFamily: theme.fonts.display, 
              color: dx > 30 ? rightConfig.color : theme.colors.muted 
            }}
          >
            {rightConfig.label} {rightConfig.emoji}
          </div>
        </div>

        {/* Card */}
        <div
          onTouchStart={onTouchStart} 
          onTouchMove={onTouchMove} 
          onTouchEnd={onTouchEnd}
          onMouseDown={onTouchStart as any}
          onMouseMove={onTouchMove as any}
          onMouseUp={onTouchEnd}
          onMouseLeave={onTouchEnd}
          className="w-full max-w-sm min-h-[220px] flex flex-col items-center justify-center p-7 cursor-grab active:cursor-grabbing select-none"
          style={{
            backgroundColor: result === 'correct' ? theme.colors.surface : result === 'wrong' ? `${theme.colors.danger}20` : theme.colors.surface,
            borderRadius: radCard, 
            border: `2px solid ${result === 'correct' ? theme.colors.success : result === 'wrong' ? theme.colors.danger : border}`,
            transform: `translateX(${dx}px) rotate(${rotation}deg)`,
            transition: dx === 0 ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.2s' : 'border-color 0.2s',
            boxShadow: shadow,
            opacity
          }}
        >
          {result ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="text-4xl mb-3">{result === 'correct' ? '✅' : '❌'}</div>
              <div className="font-bold text-[17px] mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
                {result === 'correct' ? 'Correct !' : 'Incorrect'}
              </div>
              {lastAnswer?.explanation && (
                <div className="text-[13px] text-center leading-relaxed mt-2" style={{ color: theme.colors.muted }}>
                  {lastAnswer.explanation}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="font-extrabold text-[24px] text-center leading-tight" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
                {currentItem.question}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest mt-6 opacity-50" style={{ color: theme.colors.muted }}>
                ← glisse pour classer →
              </div>
            </>
          )}
        </div>

        {/* Fallback Buttons */}
        <div className="flex gap-3 w-full max-w-sm mt-2">
          <button 
            onClick={() => !result && commit('left')} 
            className="flex-1 py-3.5 border-none cursor-pointer flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: leftConfig.color, 
              color: '#fff', 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display, 
              fontWeight: 700, 
              fontSize: 14 
            }}
            disabled={!!result}
          >
            <span>{leftConfig.emoji}</span> {leftConfig.label}
          </button>
          <button 
            onClick={() => !result && commit('right')} 
            className="flex-1 py-3.5 border-none cursor-pointer flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            style={{ 
              backgroundColor: rightConfig.color, 
              color: '#fff', 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display, 
              fontWeight: 700, 
              fontSize: 14 
            }}
            disabled={!!result}
          >
            <span>{rightConfig.emoji}</span> {rightConfig.label}
          </button>
        </div>

        <div className="text-[11px] font-semibold tracking-wider uppercase mt-4" style={{ color: theme.colors.muted }}>
          {idx + 1} / {swipes.length} cartes
        </div>
      </div>
    </div>
  );
}