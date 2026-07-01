import { useTheme, AppColors } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { SortGroupData, SortGroupItem, SortGroupGroup } from '../types/mechanics';
import { shuffle } from '../utils/array';

export default function SortGroup({ data, items: propItems, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SortGroupData }) {
  const { theme } = useTheme();
  const C: AppColors = theme.colors;
  const { config = {} } = data || {};
  
  const groups: SortGroupGroup[] = data?.groups && data.groups.length > 0 ? data.groups : [
    { id: 'g1', label: 'Groupe A', emoji: '🔴', color: '#e74c3c' },
    { id: 'g2', label: 'Groupe B', emoji: '🔵', color: '#3498db' }
  ];

  const mappedItems: SortGroupItem[] = propItems && propItems.length > 0 ? propItems.map((i, index) => ({
    id: i.id,
    text: i.payload.question || i.payload.answer || "",
    groupId: groups[index % groups.length].id
  })) : (data?.items && data.items.length > 0 ? data.items : [
    { id: '1', text: 'Item 1', groupId: 'g1' },
    { id: '2', text: 'Item 2', groupId: 'g2' }
  ]);

  const [queue] = useState<SortGroupItem[]>(() => shuffle([...mappedItems]));
  const [qIdx, setQIdx] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{correct: boolean, groupLabel: string} | null>(null);
  const [done, setDone] = useState(false);

  const current = queue[qIdx];
  const total = queue.length;
  const correctCount = Object.entries(placed).filter(([id, gid]) => queue.find((i: SortGroupItem)=>i.id===id)?.groupId===gid).length;

  const placeItem = useCallback((groupId: string) => {
    if (feedback || !current) return;
    const correct = current.groupId === groupId;
    setPlaced(p => ({...p, [current.id]: groupId}));
    
    onResponse?.(current.id, correct ? 3 : 1);

    if (config?.validateMode === 'immediate') {
      const group = groups.find((g: SortGroupGroup)=>g.id===groupId);
      setFeedback({ correct, groupLabel: group?.label || '' });
      setTimeout(() => {
        setFeedback(null);
        if (qIdx+1 >= total) { setDone(true); onComplete?.((correctCount+(correct?1:0))*15); }
        else setQIdx(i=>i+1);
      }, 900);
    } else {
      if (qIdx+1 >= total) { setDone(true); onComplete?.(correctCount*15); }
      else setQIdx(i=>i+1);
    }
  }, [feedback, current, config, groups, qIdx, total, correctCount, onComplete, onResponse]);

  if (done) return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🗂️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{correctCount}/{total} bien classés</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{correctCount*15} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Tri par groupes</span>
        <span style={{ fontSize:12, color:C.muted }}>{qIdx+1}/{total}</span>
      </div>
      <div style={{ height:4, background:C.border }}><div style={{ height:4, background:C.primary, width:`${(qIdx/total)*100}%`, transition:'width .3s' }} /></div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        <div style={{ width:'100%', maxWidth:340, background:C.surface, borderRadius:20, padding:'28px 20px', border:`2px solid ${feedback ? (feedback.correct?C.success:C.danger) : C.border}`, textAlign:'center', minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, transition:'border-color .2s' }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:C.ink }}>{current?.text}</div>
          {feedback && <div style={{ fontSize:14, fontWeight:700, color: feedback.correct?C.success:C.danger }}>{feedback.correct ? '✓ Correct !' : '✗ Mauvais'}</div>}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>Dans quelle catégorie va ce mot ?</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:340 }}>
          {groups.map((g: SortGroupGroup) => (
            <button key={g.id} onClick={() => placeItem(g.id)} style={{
              background:`${g.color}22`, border:`2px solid ${g.color}88`, borderRadius:14,
              padding:'14px 20px', display:'flex', alignItems:'center', gap:12,
              fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, color:C.ink, cursor:'pointer'
            }}>
              <span style={{ fontSize:22 }}>{g.emoji}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
