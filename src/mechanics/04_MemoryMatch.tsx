import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { MemoryMatchData } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

interface MemoryCard {
  uid: string;
  pairId: string;
  text: string;
  image?: string;
}

function buildCards(pairs: MemoryMatchData['pairs']): MemoryCard[] {
  return shuffle(pairs.flatMap(p => [
    { uid: p.id + 'A', pairId: p.id, text: p.cardA.text, image: p.cardA.image },
    { uid: p.id + 'B', pairId: p.id, text: p.cardB.text, image: p.cardB.image },
  ]));
}

export default function MemoryMatch({ data, items, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: MemoryMatchData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  // Prefer passing via `data` config if available, fallback to some defaults.
  // Note: the backend may pass pairs inside `data.pairs` or just within `items`
  // We'll trust data.pairs for now based on the original logic.
  const { pairs = [], config } = data || {};

  const [cards] = useState<MemoryCard[]>(() => buildCards(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const cols = config?.gridCols || 4;

  const totalXP = Math.max(100 - moves * 5, 20);

  const flip = useCallback((uid: string) => {
    if (locked || flipped.includes(uid) || matched.includes(uid)) return;
    const next = [...flipped, uid];
    setFlipped(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next.map(id => cards.find(c => c.uid === id));
      
      if (a && b && a.pairId === b.pairId) {
        const newMatched = [...matched, a.uid, b.uid];
        setMatched(newMatched);
        setFlipped([]);
        setLocked(false);
        onResponse?.(a.pairId, 3); // success

        if (newMatched.length === cards.length) { 
          setDone(true); 
          onComplete?.(totalXP); 
        }
      } else {
        if (a) onResponse?.(a.pairId, 1); // fail
        setTimeout(() => { 
          setFlipped([]); 
          setLocked(false); 
        }, config?.flipBackDelay || 1100);
      }
    }
  }, [locked, flipped, matched, cards, config?.flipBackDelay, onComplete, onResponse, totalXP]);

  if (cards.length === 0) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Aucune donnée pour ce jeu.</div>;
  }

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Toutes les paires !"
        subtitle={`${moves} coups`}
        points={totalXP}
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
          Memory
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {matched.length / 2}/{pairs.length} · {moves} coups
        </span>
      </div>

      <div 
        className="flex-1 p-4 grid gap-2.5 mx-auto w-full max-w-md content-start pt-6"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
        }}
      >
        {cards.map(card => {
          const isFlipped = flipped.includes(card.uid);
          const isMatched = matched.includes(card.uid);
          
          return (
            <div 
              key={card.uid} 
              onClick={() => flip(card.uid)} 
              className="aspect-square flex flex-col items-center justify-center p-2 text-center select-none transition-all duration-200"
              style={{
                borderRadius: radCard,
                cursor: isMatched ? 'default' : 'pointer',
                backgroundColor: isMatched ? theme.colors.success : isFlipped ? theme.colors.surface : `${theme.colors.surface}80`,
                border: `1px solid ${isMatched ? theme.colors.success : border}`,
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 13,
                color: isMatched ? '#fff' : theme.colors.ink,
                transform: isFlipped || isMatched ? 'scale(1)' : 'scale(0.97)',
                opacity: isMatched ? 0.6 : 1,
                boxShadow: isFlipped && !isMatched ? shadow : 'none'
              }}
            >
              <div 
                className={`transition-opacity duration-200 ${isFlipped || isMatched ? 'opacity-100' : 'opacity-0'}`}
                style={{ wordBreak: 'break-word', hyphens: 'auto' }}
              >
                {card.text}
              </div>
              {!(isFlipped || isMatched) && (
                <div className="absolute font-bold text-2xl" style={{ color: theme.colors.muted }}>
                  ?
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}