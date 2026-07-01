import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useRef, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { WordSearchData } from '../types/mechanics';

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
  const C: AppColors = theme.colors;
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

  return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Mots cachés</span>
        <span style={{ fontSize:12, color:C.muted }}>{found.length}/{words.length}</span>
      </div>
      <div style={{ flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:12 }}>
        <div ref={gridRef}
          onMouseUp={onMouseUp} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ display:'grid', gridTemplateColumns:`repeat(${size},1fr)`, gap:2, userSelect:'none', touchAction:'none' }}>
          {grid.map((row,r) => row.map((letter,c) => {
            const key = cellKey(r,c);
            const isFnd = foundCells.has(key);
            const isSel = selCells.has(key);
            const fndWord = placed.find(p=>found.includes(p.wordId)&&p.cells.some(cl=>cl.r===r&&cl.c===c));
            const bg = isFnd ? `${colorMap[fndWord?.wordId || '']||C.success}44` : isSel ? 'rgba(199,91,57,.3)' : 'transparent';
            
            return (
              <div key={key} onMouseDown={() => onMouseDown(r,c)} onMouseEnter={() => onMouseEnter(r,c)}
                style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, background:bg, fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:11, color: isFnd?C.ink:isSel?C.primary:C.muted, cursor:'default', transition:'background .1s' }}>
                {letter}
              </div>
            );
          }))}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {words.map((w: WordSearchWord, i: number) => (
            <div key={w.id} style={{ background: found.includes(w.id) ? `${COLORS[i%COLORS.length]}22` : C.surface, border:`1px solid ${found.includes(w.id)?COLORS[i%COLORS.length]:C.border}`, borderRadius:999, padding:'4px 12px', fontSize:12, fontWeight:700, color:C.ink, textDecoration:found.includes(w.id)?'line-through':'none', opacity:found.includes(w.id)?0.6:1 }}>
              {config?.hintMode==='word' ? w.word : w.hint}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
