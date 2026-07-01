import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseGameProps } from '../types';
import { BingoData } from '../types/mechanics';

import { shuffle } from '../utils/array';

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
  const C: AppColors = theme.colors;

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
      onComplete?.(100); 
    }
  };

  const currentCall = called[called.length - 1];

  if (!mappedItems || mappedItems.length < size * size) {
    return <div style={{ color: 'white', padding: 20 }}>Not enough items for a {size}x{size} Bingo board.</div>;
  }

  return (
    <div style={{ background: C.bg, minHeight: isEmbedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#131629', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>←</button>
        <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, color: C.ink }}>Bingo Québécois</span>
        <span style={{ fontSize: 12, color: C.muted }}>{marked.size} cochés</span>
      </div>
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Caleur */}
        <div style={{ background: C.surface, borderRadius: 16, padding: 16, border: `1px solid ${currentCall ? C.primary : C.border}`, textAlign: 'center', minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {!started ? (
            <button onClick={() => setStarted(true)} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>▶ Commencer</button>
          ) : currentCall ? (
            <>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Le caleur dit…</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 15, color: C.ink }}>{currentCall.clue}</div>
            </>
          ) : <div style={{ fontSize: 13, color: C.muted }}>En attente du premier appel…</div>}
        </div>
        {/* Grille */}
        {bingo && <div style={{ textAlign: 'center', fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 22, color: C.success }}>🎉 BINGO !</div>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size},1fr)`, gap: 6, flex: 1 }}>
          {grid.map((item, i) => {
            const isMarked = marked.has(i);
            const isCurrentCall = currentCall && item.id === currentCall.id && !isMarked;
            return (
              <button key={item.id} onClick={() => markCell(i)} style={{
                background: isMarked ? C.success : isCurrentCall ? 'rgba(199,91,57,.2)' : C.surface,
                border: `1px solid ${isMarked ? C.success : isCurrentCall ? C.primary : C.border}`,
                borderRadius: 10, padding: '8px 4px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 11,
                color: isMarked ? '#fff' : C.ink, cursor: 'pointer', textAlign: 'center', lineHeight: 1.3, transition: 'all .2s',
                opacity: isMarked ? 0.7 : 1
              }}>{item.term}</button>
            );
          })}
        </div>
        {config?.callerMode === 'manual' && started && !bingo && (
          <button onClick={callNext} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Appel suivant →</button>
        )}
      </div>
    </div>
  );
}
