import React, { useState, useEffect } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { MultipleChoiceData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function MultipleChoice({ items, onBack, onComplete, onResponse, isEmbedded, data }: BaseGameProps & { data?: MultipleChoiceData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const timer = data?.config?.timer || 15;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [done, setDone] = useState(false);

  const currentItem = items?.[idx];
  const totalXP = score * 30;

  useEffect(() => {
    if (answered || done || !items || items.length === 0) return;
    setTimeLeft(timer);
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          clearInterval(iv); 
          setAnswered(true);
          onResponse?.(currentItem.id, 1); // Timeout = wrong
          return 0; 
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [idx, answered, done, timer, items, currentItem]);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const select = (choice: string) => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    
    const isCorrect = choice === currentItem.payload.answer;
    if (isCorrect) {
        setScore(s => s + 1);
        onResponse?.(currentItem.id, 3); // Easy/Correct
    } else {
        onResponse?.(currentItem.id, 1); // Hard/Wrong
    }
  };

  const next = () => {
    if (idx + 1 >= items.length) { 
      setDone(true); 
      onComplete?.(totalXP); 
    } else { 
      setIdx(i => i + 1); 
      setSelected(null); 
      setAnswered(false); 
    }
  };

  const choiceColor = (choice: string) => {
    if (!answered) return theme.colors.surface;
    if (choice === currentItem.payload.answer) return theme.colors.success;
    if (choice === selected && choice !== currentItem.payload.answer) return theme.colors.danger;
    return theme.colors.surface;
  };

  if (done) {
    return (
      <GameResult 
        state={score === items.length ? 'win' : 'lose'}
        title={`${score}/${items.length} bonnes réponses`}
        points={totalXP}
        onBack={onBack}
      />
    );
  }

  const options = currentItem.payload.options || [currentItem.payload.answer];

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
          Quiz
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {idx + 1}/{items.length}
        </span>
      </div>

      {/* Timer Progress */}
      <div className="h-1 w-full" style={{ backgroundColor: border }}>
        <div 
          className="h-1 transition-all duration-1000 ease-linear" 
          style={{ 
            backgroundColor: timeLeft > timer * 0.4 ? theme.colors.success : theme.colors.danger, 
            width: `${(timeLeft / timer) * 100}%` 
          }} 
        />
      </div>

      <div className="flex-1 flex flex-col p-4 gap-4 w-full max-w-md mx-auto">
        {/* Question Card */}
        <div 
          className="p-5 flex flex-col gap-2"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: theme.colors.muted }}>
            Question {idx + 1}
          </div>
          <div className="font-bold text-[17px] leading-relaxed" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {currentItem.payload.question || currentItem.payload.translation || "Quelle est la bonne réponse ?"}
          </div>
          <div className="mt-2 text-[13px] font-bold" style={{ color: timeLeft <= 5 ? theme.colors.danger : theme.colors.muted }}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2.5">
          {options.map((choice: string, i: number) => {
            const isSelected = selected === choice;
            const isCorrect = choice === currentItem.payload.answer;
            const showAsCorrect = answered && isCorrect;
            const showAsWrong = answered && isSelected && !isCorrect;

            return (
              <button 
                key={i} 
                onClick={() => select(choice)} 
                className={`text-left p-4 cursor-pointer transition-colors flex items-center gap-3 active:scale-[0.98] ${answered ? '' : 'hover:opacity-90'}`}
                style={{
                  backgroundColor: choiceColor(choice), 
                  border: `1px solid ${showAsCorrect ? theme.colors.success : border}`,
                  borderRadius: radBtn,
                  fontFamily: theme.fonts.display,
                  color: answered && (showAsCorrect || showAsWrong) ? '#fff' : theme.colors.ink,
                }}
                disabled={answered}
              >
                {showAsCorrect && <span className="font-bold">✓</span>}
                {showAsWrong && <span className="font-bold">✗</span>}
                <span className="font-semibold text-sm">{choice}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && currentItem.payload.exemple && (
          <div 
            className="p-3.5 text-[13px] leading-relaxed"
            style={{ 
              backgroundColor: `${theme.colors.muted}15`, 
              borderRadius: radCard, 
              color: theme.colors.ink 
            }}
          >
            <span className="mr-2">💡</span>
            {currentItem.payload.exemple}
          </div>
        )}

        {/* Next Button */}
        {answered && (
          <button 
            onClick={next} 
            className="w-full py-3.5 mt-2 cursor-pointer font-bold text-[15px] active:scale-95 transition-transform"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: '#fff', 
              borderRadius: radBtn,
              fontFamily: theme.fonts.display
            }}
          >
            {idx + 1 < items.length ? 'Question suivante →' : 'Voir les résultats'}
          </button>
        )}
      </div>
    </div>
  );
}