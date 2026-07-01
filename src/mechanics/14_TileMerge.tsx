import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { TileMergeData } from '../types/mechanics';

type TileMergeBankItem = NonNullable<TileMergeData['tileBank']>[number];
import { shuffle } from '../utils/array';

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
  const C: AppColors = theme.colors;
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

  if (done) return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔢</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Toutes les paires !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Fusion de Tuiles</span>
        <span style={{ fontSize:12, color:C.muted }}>{merged}/{total} paires · {score} pts</span>
      </div>
      <div style={{ flex:1, padding:16, display:'flex', flexDirection:'column', alignItems:'center', gap:16, justifyContent:'center' }}>
        <div style={{ fontSize:12, color:C.muted, textAlign:'center' }}>Sélectionne deux tuiles qui vont ensemble</div>
        
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${size},1fr)`, gap:8, width:'100%', maxWidth:360 }}>
          {grid.map((row, r) => row.map((tile, c) => {
            const isSel = selected && selected.r===r && selected.c===c;
            const color = tile ? (colorMap[tile.id]||C.primary) : 'transparent';
            return (
              <div key={`${r}-${c}`} onClick={() => tile && selectTile(r,c)} style={{
                aspectRatio:'1', borderRadius:12,
                background: tile ? `${color}22` : 'rgba(255,255,255,.02)',
                border: `2px solid ${isSel ? color : tile ? color+'66' : 'rgba(255,255,255,.05)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:11, color:C.ink,
                cursor: tile?'pointer':'default', textAlign:'center', padding:4,
                transform: isSel ? 'scale(1.05)' : 'scale(1)',
                transition:'all .15s', lineHeight:1.2,
                boxShadow: isSel ? `0 0 12px ${color}66` : 'none'
              }}>{tile ? tile.label : ''}</div>
            );
          }))}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>Tuiles restantes : {grid.flat().filter(Boolean).length}</div>
      </div>
    </div>
  );
}
