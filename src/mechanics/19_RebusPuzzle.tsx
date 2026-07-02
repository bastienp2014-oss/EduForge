import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { RebusPuzzleData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function RebusPuzzle({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: RebusPuzzleData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { config = { hintLevel: 1 }, puzzles = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const puzzle = puzzles[idx];
  const answered = picked !== null;

  const pick = useCallback((choice: string) => {
    if (answered || !puzzle) return;
    setPicked(choice);
    const isCorrect = choice === puzzle.answer;
    if (isCorrect) setScore(s => s+40);
    if (puzzle.itemId && onResponse) {
      onResponse(puzzle.itemId, isCorrect ? 5 : 1);
    }
  }, [answered, puzzle, onResponse]);

  const next = () => {
    if (idx+1 >= puzzles.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Rébus résolus !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!puzzle) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">🧩</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucun rébus disponible
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
          Rébus 🧩
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {idx+1}/{puzzles.length}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
        {/* Rébus */}
        <div 
          className="w-full text-center p-7 border flex flex-col items-center"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: theme.colors.muted }}>
            Quel mot se cache ici ?
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {puzzle.pieces.map((p, i) => (
              <React.Fragment key={i}>
                <div className="text-center flex flex-col items-center justify-center">
                  <div className="text-5xl leading-none">{p.emoji}</div>
                  {config?.hintLevel >= 1 && (
                    <div className="text-xs font-bold mt-2" style={{ color: theme.colors.primary }}>
                      ({p.sound})
                    </div>
                  )}
                </div>
                {i < puzzle.pieces.length-1 && (
                  <div className="text-2xl font-extrabold mx-1" style={{ color: theme.colors.muted }}>+</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-4 text-lg font-medium" style={{ color: theme.colors.muted }}>= ?</div>
        </div>

        {/* Choix */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {puzzle.choices.map(c => {
            const isCorrect = answered && c===puzzle.answer;
            const isWrong = answered && c===picked && c!==puzzle.answer;
            return (
              <button 
                key={c} 
                onClick={() => pick(c)} 
                className={`p-3.5 border-2 text-sm font-bold text-center transition-all ${answered ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                style={{
                  backgroundColor: isCorrect ? `${theme.colors.success}33` : isWrong ? `${theme.colors.danger}26` : theme.colors.surface,
                  borderColor: isCorrect ? theme.colors.success : isWrong ? theme.colors.danger : border,
                  borderRadius: radCard, 
                  fontFamily: theme.fonts.display, 
                  color: theme.colors.ink, 
                }}
              >
                {isCorrect ? '✓ ' : isWrong ? '✗ ' : ''}{c}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-2">
            <div 
              className="p-3.5 text-center text-sm leading-relaxed"
              style={{ 
                backgroundColor: `${theme.colors.ink}0a`, 
                borderRadius: radCard, 
                color: theme.colors.muted 
              }}
            >
              💡 {puzzle.explanation}
            </div>
            <button 
              onClick={next} 
              className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {idx+1<puzzles.length ? 'Rébus suivant →' : 'Voir résultats'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}