import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { AnagramData } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

function shuffleStr(str: string): string[] {
  const arr = str.split('');
  const shuffled = shuffle(arr);
  return shuffled.join('') === str ? shuffleStr(str) : shuffled;
}

interface Tile {
  id: number;
  letter: string;
  used: boolean;
}

export default function Anagram({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: AnagramData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { words = [] } = data || {};
  
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => {
    if (!words || words.length === 0) return [];
    return shuffleStr(words[0].word).map((l,i) => ({ id:i, letter:l, used:false }));
  });
  const [answer, setAnswer] = useState<Tile[]>([]);
  const [result, setResult] = useState<'correct'|'wrong'|null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!words || words.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  const word = words[idx];

  const pickTile = useCallback((tile: Tile) => {
    if (tile.used || result) return;
    setTiles(ts => ts.map(t => t.id===tile.id ? {...t, used:true} : t));
    setAnswer(a => [...a, tile]);
  }, [result]);

  const removeLast = useCallback(() => {
    if (!answer.length || result) return;
    const last = answer[answer.length-1];
    setAnswer(a => a.slice(0,-1));
    setTiles(ts => ts.map(t => t.id===last.id ? {...t, used:false} : t));
  }, [answer, result]);

  const validate = useCallback(() => {
    const ans = answer.map(t=>t.letter).join('');
    const correct = ans === word.word;
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s+40);
    
    // Notify response if available
    const currentItem = items?.[idx];
    if (currentItem && onResponse) {
      onResponse(currentItem.id, correct ? 3 : 1);
    }

    setTimeout(() => {
      setResult(null);
      if (idx+1 >= words.length) { 
        setDone(true); 
        onComplete?.(score + (correct?40:0)); 
      } else {
        const ni = idx+1;
        setIdx(ni);
        setTiles(shuffleStr(words[ni].word).map((l,i)=>({id:i,letter:l,used:false})));
        setAnswer([]);
      }
    }, 1200);
  }, [answer, word, idx, words, score, onComplete, items, onResponse]);

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Bravo !"
        subtitle={`${idx + 1} mots trouvés`}
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
          Anagramme
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {idx + 1}/{words.length}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 items-center w-full max-w-md mx-auto">
        {/* Hint */}
        <div 
          className="w-full text-center py-3 px-4 text-xs leading-relaxed"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            color: theme.colors.muted,
            boxShadow: shadow
          }}
        >
          <span className="mr-2">💡</span> {word.hint}
        </div>

        {/* Answer Slots */}
        <div className="flex flex-wrap gap-2 justify-center min-h-[52px] w-full">
          {answer.map((t, i) => (
            <div 
              key={i} 
              className="w-10 h-12 flex items-center justify-center font-extrabold text-lg animate-in zoom-in-90 duration-200"
              style={{ 
                borderRadius: radBtn, 
                backgroundColor: theme.colors.surface, 
                border: `2px solid ${result === 'correct' ? theme.colors.success : result === 'wrong' ? theme.colors.danger : theme.colors.primary}`,
                fontFamily: theme.fonts.display, 
                color: theme.colors.ink 
              }}
            >
              {t.letter}
            </div>
          ))}
          {Array.from({ length: word.word.length - answer.length }).map((_, i) => (
            <div 
              key={'empty'+i} 
              className="w-10 h-12 flex items-center justify-center"
              style={{ 
                borderRadius: radBtn, 
                border: `2px dashed ${border}` 
              }} 
            />
          ))}
        </div>

        {/* Source Tiles */}
        <div className="flex flex-wrap gap-2.5 justify-center w-full max-w-[340px]">
          {tiles.map(t => (
            <button 
              key={t.id} 
              onClick={() => pickTile(t)} 
              disabled={t.used} 
              className="w-11 h-12 flex items-center justify-center border-none font-extrabold text-lg transition-all active:scale-90"
              style={{
                borderRadius: radBtn, 
                cursor: t.used ? 'default' : 'pointer',
                backgroundColor: t.used ? `${theme.colors.surface}40` : theme.colors.surface,
                border: `2px solid ${t.used ? 'transparent' : border}`,
                fontFamily: theme.fonts.display, 
                color: t.used ? 'transparent' : theme.colors.ink,
                boxShadow: !t.used ? shadow : 'none'
              }}
            >
              {t.used ? '' : t.letter}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-[340px] mt-auto">
          <button 
            onClick={removeLast} 
            disabled={!answer.length} 
            className="flex-1 py-3 border-none cursor-pointer font-bold text-[13px] active:scale-95 transition-transform disabled:opacity-50"
            style={{ 
              backgroundColor: theme.colors.surface, 
              color: theme.colors.ink, 
              border: `1px solid ${border}`, 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display 
            }}
          >
            ⌫ Effacer
          </button>
          <button 
            onClick={validate} 
            disabled={answer.length !== word.word.length || !!result} 
            className="flex-[2] py-3 border-none cursor-pointer font-bold text-[13px] active:scale-95 transition-transform disabled:opacity-50"
            style={{
              backgroundColor: answer.length === word.word.length ? theme.colors.primary : `${theme.colors.ink}10`,
              color: '#fff', 
              borderRadius: radBtn,
              fontFamily: theme.fonts.display 
            }}
          >
            Valider ✓
          </button>
        </div>

        {result && (
          <div 
            className="font-extrabold text-lg animate-in slide-in-from-bottom-2 duration-300"
            style={{ 
              fontFamily: theme.fonts.display, 
              color: result === 'correct' ? theme.colors.success : theme.colors.danger 
            }}
          >
            {result === 'correct' ? '✓ Correct !' : `✗ C'était : ${word.word}`}
          </div>
        )}
      </div>
    </div>
  );
}