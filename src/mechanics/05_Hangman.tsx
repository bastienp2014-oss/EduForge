import React, { useState } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { HangmanData } from '../types/mechanics';
import GameResult from '../components/GameResult';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const EMOJIS = ['😎','😬','😰','😓','😨','😱','💀'];

interface HangmanWord {
  id: string;
  word: string;
  hint: string;
}

export default function Hangman({ items, onBack, onComplete, onResponse, isEmbedded, data }: BaseGameProps & { data?: HangmanData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { config } = data || {};
  const maxErr = config?.maxErr ?? 6;
  const [wordIdx, setWordIdx] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const words: HangmanWord[] = items.map(item => ({
    id: item.id,
    word: (item.payload.answer || "").toUpperCase(),
    hint: item.payload.question || item.payload.translation || "Devinez le mot"
  }));

  const currentItem = words[wordIdx];

  const word = currentItem.word;
  const hint = currentItem.hint;
  const errors = guessed.filter(l => !word.includes(l)).length;
  const won = word.split('').every(l => guessed.includes(l) || l===' ' || l==='-');
  const lost = errors >= maxErr;
  const roundDone = won || lost;

  const nextWord = () => {
    const pts = won ? Math.max(50 - errors*8, 10) : 0;
    const newScore = score + pts;
    setScore(newScore);
    if (wordIdx+1 >= words.length) { 
      setDone(true); 
      onComplete?.(newScore); 
    } else { 
      setWordIdx(i => i + 1); 
      setGuessed([]); 
    }
  };

  const guess = (letter: string) => {
    if (guessed.includes(letter) || roundDone) return;
    const next = [...guessed, letter];
    setGuessed(next);
    
    // Check if round is done after this guess
    const newErrors = next.filter(l => !word.includes(l)).length;
    const newWon = word.split('').every(l => next.includes(l) || l===' ' || l==='-');
    if (newWon) {
        onResponse?.(currentItem.id, newErrors === 0 ? 3 : 2);
    } else if (newErrors >= maxErr) {
        onResponse?.(currentItem.id, 1);
    }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Partie terminée !"
        subtitle={`${score} points`}
        points={score}
        onBack={onBack}
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
          Pendu
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {wordIdx + 1}/{words.length}
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Error visual */}
        <div className="text-center mt-2">
          <div className="text-6xl mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {EMOJIS[Math.min(errors, 6)]}
          </div>
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: maxErr }).map((_, i) => (
              <div 
                key={i} 
                className="w-3.5 h-3.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: i < errors ? theme.colors.danger : `${theme.colors.ink}20` }} 
              />
            ))}
          </div>
        </div>

        {/* Hint */}
        <div 
          className="px-4 py-3 text-center text-xs leading-relaxed"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            color: theme.colors.muted,
            boxShadow: shadow
          }}
        >
          <span className="mr-2">💡</span> {hint}
        </div>

        {/* Word Display */}
        <div className="flex flex-wrap gap-2 justify-center my-2">
          {word.split('').map((l, i) => {
            const isRevealed = guessed.includes(l) || l === '-';
            const isSpace = l === ' ';
            const isSpecial = isSpace || l === '-';

            return (
              <div 
                key={i} 
                className="flex items-center justify-center font-extrabold text-2xl transition-all duration-300"
                style={{
                  width: isSpace ? 20 : 36, 
                  height: 44, 
                  borderBottom: isSpecial ? 'none' : `3px solid ${isRevealed ? theme.colors.success : theme.colors.muted}`,
                  fontFamily: theme.fonts.display,
                  color: isRevealed ? theme.colors.ink : (lost ? theme.colors.danger : 'transparent')
                }}
              >
                {l}
              </div>
            );
          })}
        </div>

        {/* Round Result */}
        {roundDone && (
          <div 
            className="p-4 text-center mt-2 animate-in fade-in zoom-in-95 duration-300"
            style={{ 
              backgroundColor: won ? `${theme.colors.success}20` : `${theme.colors.danger}20`, 
              borderRadius: radCard, 
              border: `1px solid ${won ? theme.colors.success : theme.colors.danger}` 
            }}
          >
            <div className="font-bold text-lg mb-3" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
              {won ? '✓ Correct !' : `✗ C'était : ${word}`}
            </div>
            <button 
              onClick={nextWord} 
              className="px-6 py-3 border-none cursor-pointer font-bold text-sm active:scale-95 transition-transform"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {wordIdx + 1 < words.length ? 'Mot suivant' : 'Voir les résultats'}
            </button>
          </div>
        )}

        {/* Keyboard */}
        {!roundDone && (
          <div className="flex flex-wrap gap-2 justify-center mt-auto mb-4">
            {ALPHABET.map(l => {
              const used = guessed.includes(l);
              const correct = used && word.includes(l);
              const wrong = used && !word.includes(l);

              return (
                <button 
                  key={l} 
                  onClick={() => guess(l)} 
                  disabled={used} 
                  className="w-10 h-11 flex items-center justify-center border-none font-bold text-sm transition-all active:scale-90"
                  style={{
                    borderRadius: radBtn, 
                    cursor: used ? 'default' : 'pointer',
                    backgroundColor: correct ? theme.colors.success : wrong ? `${theme.colors.danger}50` : theme.colors.surface,
                    color: used && !correct && !wrong ? theme.colors.muted : (correct || wrong ? '#fff' : theme.colors.ink), 
                    fontFamily: theme.fonts.display,
                    opacity: used && !correct && !wrong ? 0.5 : 1,
                    boxShadow: !used ? shadow : 'none'
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
