import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useRef, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { SequencingData, SequencingItem } from '../types/mechanics';
import { shuffle } from '../utils/array';

function score(items: SequencingItem[]) {
  let correct = 0;
  items.forEach((it,i) => { if(it.order === i+1) correct++; });
  return correct;
}

export default function Sequencing({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SequencingData }) {
  const { theme } = useTheme();
  const C: AppColors = theme.colors;
  const { config = {} } = data || {};
  
  const mappedItems: SequencingItem[] = propItems && propItems.length > 0 ? propItems.map((item, index) => ({
    id: item.id,
    text: item.payload.answer || item.payload.question || "",
    label: item.payload.hint || "",
    order: index + 1
  })) : (data?.items && data.items.length > 0 ? data.items : [
    { id: '1', text: 'Étape 1', order: 1 },
    { id: '2', text: 'Étape 2', order: 2 },
    { id: '3', text: 'Étape 3', order: 3 }
  ]);

  const [items, setItems] = useState<SequencingItem[]>(() => shuffle([...mappedItems]));
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState<number|null>(null);
  const [done, setDone] = useState(false);
  const dragOver = useRef<number|null>(null);
  
  const correct = submitted ? score(items) : 0;
  const total = items.length;

  const onDragStart = (i: number) => setDragging(i);
  const onDragEnter = (i: number) => { dragOver.current = i; };
  const onDragEnd = () => {
    if (dragging === null || dragOver.current === null || dragging === dragOver.current) { setDragging(null); dragOver.current=null; return; }
    const arr = [...items];
    const [moved] = arr.splice(dragging, 1);
    arr.splice(dragOver.current, 0, moved);
    setItems(arr);
    setDragging(null); dragOver.current=null;
  };

  const touchStart = useRef<number|null>(null);
  const touchIdx = useRef<number|null>(null);
  const onTouchStart = (e: React.TouchEvent, i: number) => { touchStart.current = e.touches[0].clientY; touchIdx.current = i; };
  const onTouchEnd = (e: React.TouchEvent, i: number) => {
    if (touchStart.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStart.current;
    if (Math.abs(dy) < 20) return;
    const target = dy > 0 ? Math.min(i+1, items.length-1) : Math.max(i-1, 0);
    const arr = [...items];
    const [moved] = arr.splice(i, 1);
    arr.splice(target, 0, moved);
    setItems(arr);
  };

  const validate = () => {
    setSubmitted(true);
    if (onResponse) {
      items.forEach((it, i) => {
        onResponse(it.id, it.order === i + 1 ? 3 : 1);
      });
    }
  };

  const finish = () => { setDone(true); onComplete?.(correct*20); };
  const isCorrect = (item: SequencingItem, i: number) => submitted && item.order === i+1;
  const isWrong = (item: SequencingItem, i: number) => submitted && item.order !== i+1;

  if (done) return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📅</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{correct}/{total} dans le bon ordre</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{correct*20} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Séquençage</span>
        <span style={{ fontSize:12, color:C.muted }}>{total} éléments</span>
      </div>
      <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ fontSize:12, color:C.muted, textAlign:'center', marginBottom:4 }}>Glisse pour réordonner du plus ancien au plus récent</div>
        {items.map((item, i) => (
          <div key={item.id}
            draggable={!submitted}
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            onTouchStart={e => onTouchStart(e,i)}
            onTouchEnd={e => onTouchEnd(e,i)}
            style={{
              background: isCorrect(item,i) ? 'rgba(45,122,79,.2)' : isWrong(item,i) ? 'rgba(192,57,43,.12)' : C.surface,
              border: `1px solid ${isCorrect(item,i)?C.success:isWrong(item,i)?C.danger:C.border}`,
              borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:12,
              cursor: submitted ? 'default' : 'grab', userSelect:'none',
              transition:'background .2s, border-color .2s',
              opacity: dragging===i ? 0.5 : 1
            }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,.08)', display:'grid', placeItems:'center', fontSize:13, fontWeight:800, color:C.muted, flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1, fontSize:13, color:C.ink, lineHeight:1.4 }}>{item.text}</div>
            {submitted && (
              <div style={{ fontSize:11, color: isCorrect(item,i)?C.success:C.danger, fontWeight:700, flexShrink:0 }}>
                {isCorrect(item,i) ? '✓' : `→ pos.${item.order}`}
              </div>
            )}
            {config?.showLabels && <div style={{ fontSize:10, color:C.muted, fontWeight:700, flexShrink:0 }}>{item.label}</div>}
            {!submitted && <div style={{ fontSize:18, color:'rgba(255,255,255,.2)', flexShrink:0 }}>⠿</div>}
          </div>
        ))}
        {!submitted ? (
          <button onClick={validate} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', marginTop:8 }}>Valider l'ordre</button>
        ) : (
          <>
            {submitted && config?.showLabels===false && (
              <div style={{ background:'rgba(255,255,255,.05)', borderRadius:12, padding:12 }}>
                {[...mappedItems].sort((a,b)=>a.order-b.order).map(it => (
                  <div key={it.id} style={{ fontSize:11, color:C.muted, padding:'3px 0' }}>• {it.label} — {it.text}</div>
                ))}
              </div>
            )}
            <button onClick={finish} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Terminer</button>
          </>
        )}
      </div>
    </div>
  );
}
