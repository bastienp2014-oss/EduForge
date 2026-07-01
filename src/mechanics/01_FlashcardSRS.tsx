import React, { useState } from 'react';
import { useTheme } from '../store/useTheme';
import GameHUD from '../components/GameHUD';
import GameButton from '../components/GameButton';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{color: theme.colors.ink}}>Aucune donnée pour ce jeu.</div>;
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
      <GameHUD title={`Flashcards (${currentIndex + 1}/${items.length})`} onBack={onBack} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div 
          onClick={() => setShowBack(!showBack)}
          className="w-full max-w-sm aspect-[3/4] rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: theme.colors.surface, border: `2px solid ${theme.colors.muted}40` }}
        >
          <span className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: theme.colors.muted }}>
            {showBack ? 'Réponse' : 'Question'}
          </span>
          <h2 className="text-3xl font-display font-bold" style={{ color: theme.colors.ink }}>
            {showBack ? currentItem.answer : (currentItem.question || currentItem.translation || "Question")}
          </h2>
          
          {!showBack && (
            <p className="mt-8 text-sm opacity-50" style={{ color: theme.colors.ink }}>
              Touchez pour révéler
            </p>
          )}
        </div>

        {showBack && (
          <div className="mt-8 flex gap-4 w-full max-w-sm">
            <div className="flex-1"><GameButton variant="danger" onPress={() => handleResponse(0)} fullWidth>Oublié</GameButton></div>
            <div className="flex-1"><GameButton variant="primary" onPress={() => handleResponse(1)} fullWidth>Difficile</GameButton></div>
            <div className="flex-1"><GameButton variant="success" onPress={() => handleResponse(2)} fullWidth>Facile</GameButton></div>
          </div>
        )}
      </div>
    </div>
  );
}
