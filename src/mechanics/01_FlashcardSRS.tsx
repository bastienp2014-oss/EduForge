import React, { useState } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import GameResult from '../components/GameResult';
import { BaseGameProps } from '../types';

export interface FlashcardItem {
  id: string;
  question?: string;
  answer: string;
  translation?: string;
}

export function FlashcardSRS({ items, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const flashcards: FlashcardItem[] = items.map(item => ({
    id: item.id,
    question: item.payload.question,
    answer: item.payload.answer,
    translation: item.payload.translation
  }));

  const currentItem = flashcards[currentIndex];

  const handleResponse = (quality: number) => {
    // quality: 0 (oubli), 1 (difficile), 2 (facile)
    const newScore = score + quality * 10;
    setScore(newScore);

    if (onResponse) {
      // Map quality to FSRS Rating (1=Again, 2=Hard, 3=Good, 4=Easy)
      let rating = 3;
      if (quality === 0) rating = 1;
      else if (quality === 1) rating = 2;
      else if (quality === 2) rating = 3;
      
      onResponse(currentItem.id, rating);
    }

    if (currentIndex + 1 < items.length) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    } else {
      setIsGameOver(true);
    }
  };

  if (isGameOver) {
    return (
      <GameResult
        state="win"
        title="Session Terminée"
        points={score}
        onReplay={() => {
          setCurrentIndex(0);
          setShowBack(false);
          setScore(0);
          setIsGameOver(false);
        }}
        onBack={() => {
          onComplete(Math.floor(score / 5));
          onBack();
        }}
      />
    );
  }

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
          Flashcards
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {currentIndex + 1}/{items.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1 w-full" style={{ backgroundColor: border }}>
        <div 
          className="h-1 transition-all duration-300 ease-out" 
          style={{ backgroundColor: theme.colors.primary, width: `${(currentIndex / items.length) * 100}%` }} 
        />
      </div>
      
      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 w-full">
        <div 
          onClick={() => setShowBack(!showBack)} 
          className="w-full max-w-sm min-h-[200px] flex flex-col items-center justify-center p-7 cursor-pointer select-none transition-transform active:scale-95"
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radCard,
            border: `1px solid ${border}`,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] mb-4" style={{ color: theme.colors.muted }}>
            {showBack ? 'RÉPONSE' : 'QUESTION'}
          </div>
          <div className="font-extrabold text-[22px] text-center" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink, marginBottom: showBack ? 12 : 0 }}>
            {showBack ? currentItem.answer : (currentItem.question || currentItem.translation || "Question")}
          </div>
          {showBack && currentItem.translation && (
            <div className="text-[13px] text-center leading-relaxed mt-2" style={{ color: theme.colors.muted }}>
              {currentItem.translation}
            </div>
          )}
          {!showBack && (
            <div className="text-[11px] mt-4" style={{ color: theme.colors.muted }}>
              Tapez pour révéler
            </div>
          )}
        </div>

        {showBack && (
          <div className="w-full max-w-sm mt-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] mb-2.5 text-center" style={{ color: theme.colors.muted }}>
              Comment l'avez-vous su ?
            </div>
            <div className="flex gap-2">
              {[
                { val: 0, label: 'Oublié', color: theme.colors.danger, num: 1 },
                { val: 1, label: 'Difficile', color: theme.colors.primary, num: 2 },
                { val: 2, label: 'Facile', color: theme.colors.success, num: 3 },
              ].map(r => (
                <button 
                  key={r.val} 
                  onClick={() => handleResponse(r.val)} 
                  className="flex-1 py-2.5 border-none cursor-pointer flex flex-col items-center gap-1 transition-transform active:scale-95 hover:opacity-90"
                  style={{
                    backgroundColor: r.color,
                    borderRadius: radBtn,
                    color: '#fff',
                    fontFamily: theme.fonts.display
                  }}
                >
                  <span className="text-sm font-bold">{r.num}</span>
                  <span className="text-[9px] font-bold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
