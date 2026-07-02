import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { BingoData } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

type BingoItem = {
  id: string;
  term: string;
  clue: string;
};

function checkBingo(marked: Set<number>, size: number): boolean {
  const grid = Array.from({ length: size }, (_, r) => 
    Array.from({ length: size }, (_, c) => marked.has(r * size + c))
  );
  for (let r = 0; r < size; r++) if (grid[r].every(Boolean)) return true;
  for (let c = 0; c < size; c++) if (grid.every(row => row[c])) return true;
  if (grid.every((row, i) => row[i])) return true;
  if (grid.every((row, i) => row[size - 1 - i])) return true;
  return false;
}

export default function Bingo({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: BingoData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { config = {} } = data || {};
  const size = config?.gridSize || 3;

  const mappedItems: BingoItem[] = items && items.length > 0 ? items.map(item => ({
    id: item.id,
    term: item.payload.answer || item.payload.question || "",
    clue: item.payload.question || item.payload.translation || ""
  })) : [
    { id: '1', term: 'Tiguidou', clue: "C'est super, d'accord" },
    { id: '2', term: 'Pantoute', clue: "Pas du tout" },
    { id: '3', term: 'Poudrerie', clue: "Neige soufflée par le vent" },
    { id: '4', term: 'Dépanneur', clue: "Petit commerce de proximité" },
    { id: '5', term: 'Chum', clue: "Petit ami / ami" },
    { id: '6', term: 'Blonde', clue: "Petite amie" },
    { id: '7', term: 'Piastre', clue: "Un dollar" },
    { id: '8', term: 'Frette', clue: "Très froid" },
    { id: '9', term: 'Gougounes', clue: "Sandales de plage" },
  ];

  const [grid] = useState<BingoItem[]>(() => shuffle([...mappedItems]).slice(0, size * size));
  const [called, setCalled] = useState<BingoItem[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [bingo, setBingo] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  
  const callQueue = useRef<BingoItem[]>(shuffle([...mappedItems]));
  const callRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callNext = useCallback(() => {
    setCalled(c => {
      const ni = c.length;
      if (ni >= callQueue.current.length) return c;
      const item = callQueue.current[ni];
      return [...c, item];
    });
  }, []);

  useEffect(() => {
    if (!started || bingo) return;
    if (config?.callerMode === 'auto') {
      callRef.current = setInterval(callNext, config?.callerInterval || 5000);
      return () => {
        if (callRef.current) clearInterval(callRef.current);
      };
    }
  }, [started, bingo, callNext, config]);

  const markCell = (idx: number) => {
    if (!started || bingo) return;
    const item = grid[idx];
    const lastCall = called[called.length - 1];
    
    if (!lastCall || item.id !== lastCall.id) {
      if (onResponse) onResponse(item.id, 1);
      return; 
    }
    
    const newMarked = new Set(marked);
    newMarked.add(idx);
    setMarked(newMarked);
    
    if (onResponse) onResponse(item.id, 3);

    if (checkBingo(newMarked, size)) { 
      setBingo(true); 
      if (callRef.current) clearInterval(callRef.current); 
      setTimeout(() => {
        setDone(true);
        onComplete?.(100); 
      }, 1500); // Wait a bit to show BINGO before closing
    }
  };

  const currentCall = called[called.length - 1];

  if (!mappedItems || mappedItems.length < size * size) {
    return <div className="p-4" style={{ color: theme.colors.ink }}>Pas assez d'items pour une grille de {size}x{size}.</div>;
  }

  if (done) {
    return (
      <GameResult 
        state="win"
        title="BINGO !"
        points={100}
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
          Bingo
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {marked.size} cochés
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Caller */}
        <div 
          className="p-5 text-center min-h-[100px] flex flex-col items-center justify-center transition-colors duration-300"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${currentCall && !bingo ? theme.colors.primary : border}`,
            boxShadow: shadow
          }}
        >
          {!started ? (
            <button 
              onClick={() => setStarted(true)} 
              className="px-6 py-3 border-none cursor-pointer font-bold text-sm active:scale-95 transition-transform"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              ▶ Commencer
            </button>
          ) : currentCall && !bingo ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.muted }}>
                Le caleur dit…
              </div>
              <div className="font-extrabold text-[15px] leading-snug" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
                {currentCall.clue}
              </div>
            </div>
          ) : bingo ? (
            <div className="animate-in fade-in zoom-in duration-300 font-extrabold text-2xl" style={{ fontFamily: theme.fonts.display, color: theme.colors.success }}>
              🎉 BINGO !
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: theme.colors.muted }}>
              En attente du premier appel…
            </div>
          )}
        </div>

        {/* Grid */}
        <div 
          className="grid flex-1 max-h-[400px] gap-2 mx-auto w-full"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {grid.map((item, i) => {
            const isMarked = marked.has(i);
            const isCurrentCall = currentCall && item.id === currentCall.id && !isMarked;
            
            return (
              <button 
                key={item.id} 
                onClick={() => markCell(i)} 
                className="p-2 border-2 font-bold text-xs leading-snug transition-all cursor-pointer break-words flex items-center justify-center text-center active:scale-95"
                style={{
                  backgroundColor: isMarked ? theme.colors.success : isCurrentCall ? `${theme.colors.primary}33` : theme.colors.surface,
                  borderColor: isMarked ? theme.colors.success : isCurrentCall ? theme.colors.primary : border,
                  borderRadius: radBtn, 
                  fontFamily: theme.fonts.display,
                  color: isMarked ? '#fff' : theme.colors.ink, 
                  opacity: isMarked ? 0.8 : 1,
                  boxShadow: !isMarked && !isCurrentCall ? shadow : 'none'
                }}
              >
                {item.term}
              </button>
            );
          })}
        </div>

        {/* Manual Call Next */}
        {config?.callerMode === 'manual' && started && !bingo && (
          <button 
            onClick={callNext} 
            className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform mt-auto"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: '#fff', 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display 
            }}
          >
            Appel suivant →
          </button>
        )}
      </div>
    </div>
  );
}
