import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { TileMergeData } from '../types/mechanics';
import GameResult from '../components/GameResult';
import { shuffle } from '../utils/array';

type TileMergeBankItem = NonNullable<TileMergeData['tileBank']>[number];

function initGrid(bank: TileMergeBankItem[], size: number) {
  const picked = shuffle(bank).slice(0, size*size);
  return Array.from({length:size}, (_,r) =>
    Array.from({length:size}, (_,c) => {
      const t = picked[r*size+c];
      return t ? { ...t, uid: t.id+'_'+Math.random().toString(36).slice(2) } : null;
    })
  );
}

export default function TileMerge({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: TileMergeData }) {
  const { theme } = useTheme();
  const { border, shadow } = useThemeTokens();
  const { config = {} } = data || {};
  const size = config?.gridSize || 4;
  
  const tileBank: TileMergeBankItem[] = data?.tileBank && data.tileBank.length > 0 ? data.tileBank : (propItems && propItems.length > 0 ? propItems.flatMap((i, index) => [
    { id: `t1-${index}`, pairId: `p-${index}`, sourceId: i.id, label: i.payload.question || "" },
    { id: `t2-${index}`, pairId: `p-${index}`, sourceId: i.id, label: i.payload.answer || "" }
  ]) : [
    { id: '1', pairId: 'p1', label: 'A' },
    { id: '2', pairId: 'p1', label: 'A' },
    { id: '3', pairId: 'p2', label: 'B' },
    { id: '4', pairId: 'p2', label: 'B' }
  ]);
  
  const [grid, setGrid] = useState(() => initGrid(tileBank, size));
  const [merged, setMerged] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{r:number, c:number} | null>(null);

  const total = Math.floor(tileBank.length / 2);

  const selectTile = useCallback((r: number, c: number) => {
    const tile = grid[r][c];
    if (!tile) return;
    
    if (!selected) { setSelected({r,c}); return; }
    if (selected.r===r && selected.c===c) { setSelected(null); return; }
    
    const selTile = grid[selected.r][selected.c];
    if (selTile && tile.pairId === selTile.pairId) {
      if (onResponse && tile.sourceId) onResponse(tile.sourceId, 3);
      
      const newGrid = grid.map(row => [...row]);
      newGrid[selected.r][selected.c] = null;
      newGrid[r][c] = null;
      setGrid(newGrid);
      const newMerged = merged+1;
      setMerged(newMerged);
      setScore(s => s+50);
      
      if (newMerged >= total) { setTimeout(() => onComplete?.(score+50), 400); }
    }
    setSelected(null);
  }, [grid, selected, merged, score, total, onComplete, onResponse]);

  const tileColors = [
    '#6366f1','#8b5cf6','#C75B39','#2D7A4F','#2B5AA0','#f59e0b','#06b6d4','#ec4899'
  ];
  
  const colorMap: Record<string, string> = {};
  tileBank.forEach((t: TileMergeBankItem, i: number) => { colorMap[t.id]=tileColors[i%tileColors.length]; colorMap[t.pairId]=tileColors[i%tileColors.length]; });

  const done = merged >= total;

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Toutes les paires !"
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
          Fusion de Tuiles
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {merged}/{total} paires · {score} pts
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col items-center gap-5 justify-center">
        <div className="text-xs text-center" style={{ color: theme.colors.muted }}>
          Sélectionne deux tuiles qui vont ensemble
        </div>
        
        <div 
          className="grid gap-2 w-full max-w-sm"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((row, r) => row.map((tile, c) => {
            const isSel = selected && selected.r === r && selected.c === c;
            const color = tile ? (colorMap[tile.id] || theme.colors.primary) : 'transparent';
            
            return (
              <div 
                key={`${r}-${c}`} 
                onClick={() => tile && selectTile(r, c)} 
                className={`
                  aspect-square rounded-xl flex items-center justify-center p-1 text-center leading-tight
                  font-extrabold text-[11px] transition-all duration-150
                  ${tile ? 'cursor-pointer' : 'cursor-default'}
                `}
                style={{
                  backgroundColor: tile ? `${color}22` : `${theme.colors.ink}05`,
                  border: `2px solid ${isSel ? color : tile ? `${color}66` : `${theme.colors.ink}0d`}`,
                  color: theme.colors.ink,
                  fontFamily: theme.fonts.display,
                  transform: isSel ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSel ? `0 0 12px ${color}66` : tile ? shadow : 'none'
                }}
              >
                {tile ? tile.label : ''}
              </div>
            );
          }))}
        </div>
        
        <div className="text-xs" style={{ color: theme.colors.muted }}>
          Tuiles restantes : {grid.flat().filter(Boolean).length}
        </div>
      </div>
    </div>
  );
}
