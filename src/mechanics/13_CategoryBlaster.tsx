import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseGameProps } from '../types';
import { CategoryBlasterData } from '../types/mechanics';

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
  const C: AppColors = theme.colors;

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

  if (done) return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, color: C.ink, marginBottom: 8 }}>{score} points !</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 32 }}>{gameItems.current.length} items classés</div>
      <button onClick={onBack} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 32px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Retour</button>
    </div>
  );

  const item = gameItems.current[idx];
  const pct = timeMax > 0 ? (timeLeft / timeMax) * 100 : 0;

  return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#131629', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>Blaster</span>
        <span style={{ fontSize: 12, color: C.muted }}>⭐ {score} {combo >= 3 ? '🔥' : ''}</span>
      </div>
      {/* Timer bar */}
      <div style={{ height: 6, background: C.border, transition: 'none' }}>
        <div style={{ height: 6, background: pct > 50 ? C.success : pct > 25 ? '#f59e0b' : C.danger, width: `${pct}%`, transition: 'width .05s linear' }} />
      </div>
      <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {/* Item card */}
        <div style={{ width: '100%', maxWidth: 340, background: feedback ? (feedback.correct ? 'rgba(45,122,79,.15)' : 'rgba(192,57,43,.12)') : C.surface, borderRadius: 22, border: `2px solid ${feedback ? (feedback.correct ? C.success : C.danger) : C.border}`, padding: '36px 20px', textAlign: 'center', transition: 'all .15s', minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {feedback ? (
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 20, color: feedback.correct ? C.success : C.danger }}>{feedback.label}</div>
          ) : (
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 30, color: C.ink }}>{item?.text}</div>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>{idx + 1}/{gameItems.current.length} · Combo: {combo}</div>
        {/* Catégories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          {categories.map((cat: BlasterCategory) => (
            <button key={cat.id} onClick={() => pick(cat.id)} style={{
              background: `${cat.color}22`, border: `2px solid ${cat.color}66`,
              borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
              fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 16, color: C.ink, cursor: 'pointer'
            }}>
              <span style={{ fontSize: 24 }}>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
