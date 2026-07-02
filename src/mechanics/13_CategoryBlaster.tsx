import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { CategoryBlasterData } from '../types/mechanics';
import GameResult from '../components/GameResult';
import { shuffle } from '../utils/array';

type BlasterItem = {
  id: string;
  categoryId: string;
  text: string;
};

type BlasterCategory = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

type FeedbackData = { correct: boolean; label: string };

export default function CategoryBlaster({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: CategoryBlasterData }) {
  const { theme } = useTheme();
  const { border, radCard, shadow } = useThemeTokens();

  const { config = {} } = data || {};

  const categories: BlasterCategory[] = [
    { id: 'c1', label: 'Nourriture', emoji: '🍔', color: '#3498db' },
    { id: 'c2', label: 'Transport', emoji: '🚗', color: '#e67e22' },
  ];

  const mappedItems: BlasterItem[] = items && items.length > 0 ? items.map((i, index) => ({
    id: i.id,
    categoryId: index % 2 === 0 ? 'c1' : 'c2', // placeholder categorization
    text: i.payload.question || i.payload.answer || ""
  })) : [
    { id: '1', categoryId: 'c1', text: 'Pomme' },
    { id: '2', categoryId: 'c2', text: 'Voiture' },
    { id: '3', categoryId: 'c1', text: 'Pizza' },
    { id: '4', categoryId: 'c2', text: 'Avion' }
  ];

  const gameItems = useRef<BlasterItem[]>(shuffle([...mappedItems]));
  const [idx, setIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(1);
  const [timeMax, setTimeMax] = useState<number>(config.baseTimeMs || 3500);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((ms: number) => {
    setTimeLeft(ms);
    setTimeMax(ms);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 50) {
          if (timerRef.current) clearInterval(timerRef.current);
          setFeedback({ correct: false, label: '⏱ Temps !' });
          setCombo(0);
          setTimeout(() => {
            setFeedback(null);
            setIdx(i => {
              const ni = i + 1;
              if (ni >= gameItems.current.length) { 
                setDone(true); 
                return i; 
              }
              const nextMs = Math.max(ms * (config?.speedupFactor || .92), config?.minTimeMs || 1200);
              startTimer(nextMs);
              return ni;
            });
          }, 800);
          return 0;
        }
        return t - 50;
      });
    }, 50);
  }, [config]);

  useEffect(() => {
    startTimer(config?.baseTimeMs || 3500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config, startTimer]);

  const pick = useCallback((catId: string) => {
    if (feedback) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    const item = gameItems.current[idx];
    const correct = item.categoryId === catId;
    
    if (onResponse) {
      onResponse(item.id, correct ? 3 : 1);
    }
    
    const newCombo = correct ? combo + 1 : 0;
    const pts = correct ? (10 + (config?.comboBonus && newCombo >= 3 ? newCombo * 5 : 0)) : 0;
    
    setScore(s => s + pts);
    setCombo(newCombo);
    setFeedback({ correct, label: correct ? (newCombo >= 3 ? `🔥 COMBO x${newCombo}!` : '✓ Correct !') : '✗ Mauvais' });
    
    setTimeout(() => {
      setFeedback(null);
      const ni = idx + 1;
      if (ni >= gameItems.current.length) { 
        setDone(true); 
        onComplete?.(score + pts); 
        return; 
      }
      setIdx(ni);
      const nextMs = Math.max(timeMax * (config?.speedupFactor || .92), config?.minTimeMs || 1200);
      startTimer(nextMs);
    }, 700);
  }, [feedback, idx, combo, score, timeMax, config, startTimer, onComplete, onResponse]);

  if (done) {
    return (
      <GameResult 
        state="win"
        title={`${score} points !`}
        points={score}
        onBack={onBack}
      />
    );
  }

  const item = gameItems.current[idx];
  const pct = timeMax > 0 ? (timeLeft / timeMax) * 100 : 0;

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
          Blaster
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          ⭐ {score} {combo >= 3 ? '🔥' : ''}
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: border }}>
        <div 
          className="h-full transition-all duration-75" 
          style={{ 
            backgroundColor: pct > 50 ? theme.colors.success : pct > 25 ? '#f59e0b' : theme.colors.danger, 
            width: `${pct}%` 
          }} 
        />
      </div>

      <div className="flex-1 p-6 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
        {/* Item card */}
        <div 
          className="w-full text-center p-9 min-h-[160px] flex flex-col items-center justify-center transition-all duration-200"
          style={{ 
            backgroundColor: feedback ? (feedback.correct ? `${theme.colors.success}26` : `${theme.colors.danger}1f`) : theme.colors.surface, 
            borderRadius: radCard, 
            border: `2px solid ${feedback ? (feedback.correct ? theme.colors.success : theme.colors.danger) : border}`,
            boxShadow: shadow
          }}
        >
          {feedback ? (
            <div className="font-extrabold text-xl animate-in fade-in zoom-in-95" style={{ fontFamily: theme.fonts.display, color: feedback.correct ? theme.colors.success : theme.colors.danger }}>
              {feedback.label}
            </div>
          ) : (
            <div className="font-extrabold text-3xl animate-in fade-in" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
              {item?.text}
            </div>
          )}
        </div>

        <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: theme.colors.muted }}>
          {idx + 1}/{gameItems.current.length} · Combo: {combo}
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-3 w-full">
          {categories.map((cat: BlasterCategory) => (
            <button 
              key={cat.id} 
              onClick={() => pick(cat.id)} 
              className="w-full flex items-center gap-4 p-4 border-2 font-bold text-base cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: `${cat.color}22`, 
                borderColor: `${cat.color}66`,
                borderRadius: radCard, 
                fontFamily: theme.fonts.display, 
                color: theme.colors.ink
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
