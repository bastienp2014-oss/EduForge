import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { validateMode:'immediate', shuffle:true },
  groups: [
    { id:'joual',      label:'Joual',      color:'#2D7A4F', emoji:'🗣️' },
    { id:'anglicisme', label:'Anglicisme', color:'#2B5AA0', emoji:'🇬🇧' },
    { id:'sacre',      label:'Sacre',      color:'#C75B39', emoji:'🔥' },
  ],
  items: [
    { id:'i1', text:'Pogner',    groupId:'joual'      },
    { id:'i2', text:'Checker',   groupId:'anglicisme' },
    { id:'i3', text:'Tabarnac',  groupId:'sacre'      },
    { id:'i4', text:'Magasiner', groupId:'joual'      },
    { id:'i5', text:'Canceller', groupId:'anglicisme' },
    { id:'i6', text:'Câlice',    groupId:'sacre'      },
    { id:'i7', text:'Chum',      groupId:'joual'      },
    { id:'i8', text:'Parker',    groupId:'anglicisme' },
    { id:'i9', text:'Estie',     groupId:'sacre'      },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }

export default function SortGroup({ data = SAMPLE, onBack, onComplete }) {
  const [queue] = useState(() => shuffle(data.items));
  const [qIdx, setQIdx] = useState(0);
  const [placed, setPlaced] = useState({}); // itemId -> groupId
  const [feedback, setFeedback] = useState(null); // { correct, groupLabel }
  const [done, setDone] = useState(false);

  const current = queue[qIdx];
  const total = queue.length;
  const correctCount = Object.entries(placed).filter(([id, gid]) => queue.find(i=>i.id===id)?.groupId===gid).length;

  const placeItem = useCallback((groupId) => {
    if (feedback || !current) return;
    const correct = current.groupId === groupId;
    setPlaced(p => ({...p, [current.id]: groupId}));
    if (data.config?.validateMode === 'immediate') {
      const group = data.groups.find(g=>g.id===groupId);
      setFeedback({ correct, groupLabel: group.label });
      setTimeout(() => {
        setFeedback(null);
        if (qIdx+1 >= total) { setDone(true); onComplete?.((correctCount+(correct?1:0))*15); }
        else setQIdx(i=>i+1);
      }, 900);
    } else {
      if (qIdx+1 >= total) { setDone(true); onComplete?.(correctCount*15); }
      else setQIdx(i=>i+1);
    }
  }, [feedback, current, data, qIdx, total, correctCount, onComplete]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🗂️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{correctCount}/{total} bien classés</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{correctCount*15} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Tri par groupes</span>
        <span style={{ fontSize:12, color:C.muted }}>{qIdx+1}/{total}</span>
      </div>
      <div style={{ height:4, background:C.border }}><div style={{ height:4, background:C.primary, width:`${(qIdx/total)*100}%`, transition:'width .3s' }} /></div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        {/* Carte en cours */}
        <div style={{ width:'100%', maxWidth:340, background:C.card, borderRadius:20, padding:'28px 20px', border:`2px solid ${feedback ? (feedback.correct?C.success:C.danger) : C.border}`, textAlign:'center', minHeight:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, transition:'border-color .2s' }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:C.ink }}>{current?.text}</div>
          {feedback && <div style={{ fontSize:14, fontWeight:700, color: feedback.correct?C.success:C.danger }}>{feedback.correct ? '✓ Correct !' : '✗ Mauvais'}</div>}
        </div>
        <div style={{ fontSize:12, color:C.muted }}>Dans quelle catégorie va ce mot ?</div>
        {/* Groupes */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:340 }}>
          {data.groups.map(g => (
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