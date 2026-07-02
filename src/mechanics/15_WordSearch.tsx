import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { WordSearchData } from '../types/mechanics';
import GameResult from '../components/GameResult';

type WordSearchWord = NonNullable<WordSearchData['words']>[number];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const COLORS = ['#6366f1','#C75B39','#2D7A4F','#f59e0b','#06b6d4'];

type PlacedWord = {
  wordId: string;
  cells: {r: number, c: number}[];
};

function buildGrid(words: WordSearchWord[], size: number) {
  const grid = Array.from({length:size}, () => Array(size).fill(''));
  const placed: PlacedWord[] = [];
  const dirs = [{dr:0,dc:1},{dr:1,dc:0}];
  
  for (const w of words) {
    if (!w.word) continue;
    const letters = w.word.toUpperCase();
    let tries = 0, ok = false;
    while (tries++ < 200 && !ok) {
      const dir = dirs[Math.floor(Math.random()*dirs.length)];
      const r0 = Math.floor(Math.random()*(size - (dir.dr?letters.length:1)));
      const c0 = Math.floor(Math.random()*(size - (dir.dc?letters.length:1)));
      const cells = letters.split('').map((l,i) => ({ r:r0+dir.dr*i, c:c0+dir.dc*i, l }));
      if (cells.every(({r,c,l}) => grid[r][c]===''||grid[r][c]===l)) {
        cells.forEach(({r,c,l}) => grid[r][c]=l);
        placed.push({ wordId:w.id, cells:cells.map(({r,c})=>({r,c})) });
        ok = true;
      }
    }
  }
  
  for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(!grid[r][c]) grid[r][c]=LETTERS[Math.floor(Math.random()*26)];
  
  return { grid, placed };
}

function cellKey(r: number,c: number) { return `${r}-${c}`; }

export default function WordSearch({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: WordSearchData }) {
  const { theme } = useTheme();
  const { border } = useThemeTokens();
  const { config = {} } = data || {};
  const size = config.gridSize || 10;
  
  const words: WordSearchWord[] = data?.words && data.words.length > 0 ? data.words : (propItems && propItems.length > 0 ? propItems.map((i) => ({
    id: i.id,
    word: (i.payload.answer || i.payload.question || "").replace(/[^A-Za-z]/g, '').substring(0, 8),
    hint: i.payload.question || ""
  })) : [
    { id: '1', word: 'POMME', hint: 'Fruit rouge' },
    { id: '2', word: 'BANANE', hint: 'Fruit jaune' }
  ]);

  const [{ grid, placed }] = useState(() => buildGrid(words, size));
  const [found, setFound] = useState<string[]>([]);
  const [selecting, setSelecting] = useState<{r:number, c:number}[]>([]);
  const [touching, setTouching] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const foundCells = new Set(
    placed.filter(p=>found.includes(p.wordId)).flatMap(p=>p.cells.map(c=>cellKey(c.r,c.c)))
  );
  const selCells = new Set(selecting.map(c=>cellKey(c.r,c.c)));

  const checkSelection = useCallback((sel: {r:number, c:number}[]) => {
    for (const p of placed) {
      if (found.includes(p.wordId)) continue;
      const match = p.cells.every((c,i) => sel[i] && sel[i].r===c.r && sel[i].c===c.c);
      const revMatch = p.cells.every((c,i) => sel[i] && sel[p.cells.length-1-i] && sel[p.cells.length-1-i].r===c.r && sel[p.cells.length-1-i].c===c.c);
      if ((sel.length===p.cells.length) && (match||revMatch)) {
        if (onResponse) onResponse(p.wordId, 3);
        const newFound = [...found, p.wordId];
        setFound(newFound);
        if (newFound.length >= words.length) setTimeout(() => onComplete?.(newFound.length*30), 500);
        return;
      }
    }
  }, [found, placed, words.length, onComplete, onResponse]);

  const getCell = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const cellW = rect.width / size;
    const cellH = rect.height / size;
    const c = Math.floor((clientX - rect.left) / cellW);
    const r = Math.floor((clientY - rect.top) / cellH);
    if (r<0||r>=size||c<0||c>=size) return null;
    return { r, c };
  }, [size]);

  const onMouseDown = (r: number,c: number) => setSelecting([{r,c}]);
  const onMouseEnter = (r: number,c: number) => { if (selecting.length>0) setSelecting(s => [...s.filter(x=>!(x.r===r&&x.c===c)), {r,c}]); };
  const onMouseUp = () => { checkSelection(selecting); setSelecting([]); };

  const onTouchStart = (e: React.TouchEvent) => { e.preventDefault(); setTouching(true); const cell=getCell(e.touches[0].clientX,e.touches[0].clientY); if(cell) setSelecting([cell]); };
  const onTouchMove = (e: React.TouchEvent) => { e.preventDefault(); const cell=getCell(e.touches[0].clientX,e.touches[0].clientY); if(cell&&selecting.length>0) setSelecting(s=>{const last=s[s.length-1];return last.r===cell.r&&last.c===cell.c?s:[...s,cell]}); };
  const onTouchEnd = () => { checkSelection(selecting); setSelecting([]); setTouching(false); };

  const colorMap: Record<string, string> = {};
  placed.forEach((p,i) => { colorMap[p.wordId] = COLORS[i%COLORS.length]; });

  if (found.length >= words.length) {
    return (
      <GameResult 
        state="win"
        title="Mots tous trouvés !"
        points={words.length * 30}
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
          Mots cachés
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {found.length}/{words.length}
        </span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-4 max-w-lg mx-auto w-full justify-center">
        {/* Grid */}
        <div 
          ref={gridRef}
          onMouseUp={onMouseUp} 
          onTouchStart={onTouchStart} 
          onTouchMove={onTouchMove} 
          onTouchEnd={onTouchEnd}
          className="grid gap-0.5 select-none touch-none mx-auto w-full"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {grid.map((row,r) => row.map((letter,c) => {
            const key = cellKey(r,c);
            const isFnd = foundCells.has(key);
            const isSel = selCells.has(key);
            const fndWord = placed.find(p=>found.includes(p.wordId)&&p.cells.some(cl=>cl.r===r&&cl.c===c));
            const bg = isFnd ? `${colorMap[fndWord?.wordId || '']||theme.colors.success}44` : isSel ? `${theme.colors.primary}4d` : 'transparent';
            
            return (
              <div 
                key={key} 
                onMouseDown={() => onMouseDown(r,c)} 
                onMouseEnter={() => onMouseEnter(r,c)}
                className="aspect-square flex items-center justify-center rounded transition-colors duration-100 font-bold text-[11px] cursor-default"
                style={{ 
                  backgroundColor: bg, 
                  fontFamily: theme.fonts.display, 
                  color: isFnd ? theme.colors.ink : isSel ? theme.colors.primary : theme.colors.muted 
                }}
              >
                {letter}
              </div>
            );
          }))}
        </div>

        {/* Words list */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {words.map((w: WordSearchWord, i: number) => {
            const isFound = found.includes(w.id);
            const wColor = COLORS[i % COLORS.length];
            return (
              <div 
                key={w.id} 
                className="rounded-full px-3 py-1 text-xs font-bold transition-all duration-300"
                style={{ 
                  backgroundColor: isFound ? `${wColor}22` : theme.colors.surface, 
                  border: `1px solid ${isFound ? wColor : border}`, 
                  color: theme.colors.ink, 
                  textDecoration: isFound ? 'line-through' : 'none', 
                  opacity: isFound ? 0.6 : 1 
                }}
              >
                {config?.hintMode === 'word' ? w.word : w.hint}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
