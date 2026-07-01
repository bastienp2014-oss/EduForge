import React, { useState, useRef, useCallback, useEffect } from 'react';

const SAMPLE = {
  config: { shuffleRight:true, lineColor:'#C75B39' },
  pairs: [
    { id:'m1', left:{ text:'Achaler' },        right:{ text:'Agacer' } },
    { id:'m2', left:{ text:'Tuque' },           right:{ text:'Bonnet de laine' } },
    { id:'m3', left:{ text:'Magasiner' },       right:{ text:'Faire du shopping' } },
    { id:'m4', left:{ text:'Chum' },            right:{ text:'Ami / copain' } },
    { id:'m5', left:{ text:'Débarbouillette' }, right:{ text:'Gant de toilette' } },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }

export default function LineMatching({ data = SAMPLE, onBack, onComplete }) {
  const [rights] = useState(() => data.config?.shuffleRight ? shuffle(data.pairs.map(p=>({...p.right, pairId:p.id}))) : data.pairs.map(p=>({...p.right, pairId:p.id})));
  const [selected, setSelected] = useState(null); // pairId of selected left
  const [connections, setConnections] = useState({}); // leftPairId -> rightPairId
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const correct = Object.entries(connections).filter(([l,r]) => l===r).length;
  const total = data.pairs.length;

  const pickLeft = (pairId) => {
    if (submitted) return;
    setSelected(s => s===pairId ? null : pairId);
  };

  const pickRight = (pairId) => {
    if (submitted || !selected) return;
    setConnections(c => {
      const next = {...c};
      // Remove any existing connection to this right
      Object.keys(next).forEach(k => { if(next[k]===pairId) delete next[k]; });
      next[selected] = pairId;
      return next;
    });
    setSelected(null);
  };

  const validate = () => { setSubmitted(true); };
  const finish = () => { setDone(true); onComplete?.(correct*20); };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔗</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{correct}/{total} bonnes associations</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{correct*20} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Associations</span>
        <span style={{ fontSize:12, color:C.muted }}>{Object.keys(connections).length}/{total}</span>
      </div>
      <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ fontSize:12, color:C.muted, textAlign:'center', marginBottom:4 }}>Sélectionne un mot à gauche, puis sa définition à droite</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flex:1 }}>
          {/* Gauche */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.pairs.map(p => {
              const isSelected = selected===p.id;
              const isConnected = connections[p.id];
              const isCorrect = submitted && connections[p.id]===p.id;
              const isWrong = submitted && connections[p.id] && connections[p.id]!==p.id;
              return (
                <button key={p.id} onClick={() => pickLeft(p.id)} style={{
                  background: isCorrect?'rgba(45,122,79,.2)':isWrong?'rgba(192,57,43,.15)':isSelected?'rgba(199,91,57,.2)':isConnected?'rgba(255,255,255,.08)':C.card,
                  border: `2px solid ${isCorrect?C.success:isWrong?C.danger:isSelected?C.primary:C.border}`,
                  borderRadius:12, padding:'12px 10px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:C.ink, cursor:'pointer', textAlign:'left', transition:'all .15s'
                }}>{p.left.text}</button>
              );
            })}
          </div>
          {/* Droite */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {rights.map(r => {
              const isLinked = Object.values(connections).includes(r.pairId);
              const leftKey = Object.keys(connections).find(k=>connections[k]===r.pairId);
              const isCorrect = submitted && leftKey===r.pairId;
              const isWrong = submitted && isLinked && leftKey!==r.pairId;
              return (
                <button key={r.pairId} onClick={() => pickRight(r.pairId)} style={{
                  background: isCorrect?'rgba(45,122,79,.2)':isWrong?'rgba(192,57,43,.15)':isLinked?'rgba(255,255,255,.08)':selected?'rgba(99,102,241,.1)':C.card,
                  border: `2px solid ${isCorrect?C.success:isWrong?C.danger:isLinked?C.primary:selected?'rgba(99,102,241,.4)':C.border}`,
                  borderRadius:12, padding:'12px 10px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:12, color:C.ink, cursor:'pointer', textAlign:'left', transition:'all .15s'
                }}>{r.text}</button>
              );
            })}
          </div>
        </div>
        {!submitted ? (
          <button onClick={validate} disabled={Object.keys(connections).length < total} style={{ background: Object.keys(connections).length>=total?C.primary:'rgba(255,255,255,.08)', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Valider</button>
        ) : (
          <button onClick={finish} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Terminer → +{correct*20} pts</button>
        )}
      </div>
    </div>
  );
}