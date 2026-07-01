import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { inputMode: 'click', showWordBank: true },
  exercises: [
    {
      id: 'ex1',
      text: 'Au Québec, on dit [1] plutôt que "faire du shopping". Le mot [2] désigne un bonnet de laine, et [3] signifie agacer quelqu'un.',
      blanks: [
        { id:'1', answer:'magasiner', alternatives:[] },
        { id:'2', answer:'tuque',     alternatives:[] },
        { id:'3', answer:'achaler',   alternatives:['énerver'] },
      ]
    },
    {
      id: 'ex2',
      text: 'Le [1] est un ami ou copain en québécois. On dit aussi [2] pour attraper quelque chose, et [3] pour une gant de toilette.',
      blanks: [
        { id:'1', answer:'chum',             alternatives:[] },
        { id:'2', answer:'pogner',           alternatives:[] },
        { id:'3', answer:'débarbouillette',  alternatives:[] },
      ]
    }
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

function buildWordBank(exercises) {
  const all = exercises.flatMap(ex => ex.blanks.map(b => b.answer));
  return [...new Set(all)].sort(() => Math.random() - .5);
}

function parseText(text, blanks, fills, onPick, answered) {
  const parts = [];
  let last = 0;
  const regex = /[(d+)]/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={last} style={{ color:'rgba(255,255,255,.75)', lineHeight:1.8 }}>{text.slice(last, m.index)}</span>);
    const bid = m[1];
    const blank = blanks.find(b => b.id === bid);
    const filled = fills[bid];
    const correct = answered && blank && (filled === blank.answer || (blank.alternatives||[]).includes(filled));
    const wrong = answered && filled && !correct;
    parts.push(
      <span key={bid} style={{
        display:'inline-block', minWidth:90, borderBottom: filled ? 'none' : '2px solid rgba(255,255,255,.3)',
        background: filled ? (answered ? (correct?'rgba(45,122,79,.25)':'rgba(192,57,43,.2)') : 'rgba(199,91,57,.15)') : 'transparent',
        borderRadius: filled ? 6 : 0, padding: filled ? '1px 8px' : '1px 4px',
        color: answered ? (correct?'#4ade80':wrong?'#f87171':C.ink) : C.primary,
        fontWeight:700, fontSize:14, cursor: filled&&!answered ? 'pointer' : 'default',
        margin:'0 2px'
      }} onClick={() => !answered && filled && onPick(bid, null)}>{filled || '___'}</span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<span key='end' style={{ color:'rgba(255,255,255,.75)', lineHeight:1.8 }}>{text.slice(last)}</span>);
  return parts;
}

export default function ClozeTest({ data = SAMPLE, onBack, onComplete }) {
  const [exIdx, setExIdx] = useState(0);
  const [fills, setFills] = useState({});
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wordBank] = useState(() => buildWordBank(data.exercises));

  const ex = data.exercises[exIdx];
  const allFilled = ex.blanks.every(b => fills[b.id]);

  const pick = useCallback((word) => {
    if (answered) return;
    const firstEmpty = ex.blanks.find(b => !fills[b.id]);
    if (!firstEmpty) return;
    setFills(f => ({ ...f, [firstEmpty.id]: word }));
  }, [answered, ex, fills]);

  const clearBlank = useCallback((bid) => {
    if (answered) return;
    setFills(f => { const n = {...f}; delete n[bid]; return n; });
  }, [answered]);

  const validate = () => {
    let pts = 0;
    ex.blanks.forEach(b => {
      const f = fills[b.id];
      if (f === b.answer || (b.alternatives||[]).includes(f)) pts += 20;
    });
    setScore(s => s + pts);
    setAnswered(true);
  };

  const next = () => {
    if (exIdx+1 >= data.exercises.length) { setDone(true); onComplete?.(score); }
    else { setExIdx(i=>i+1); setFills({}); setAnswered(false); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📝</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Exercices terminés !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  const usedWords = Object.values(fills);

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Texte à trous</span>
        <span style={{ fontSize:12, color:C.muted }}>{exIdx+1}/{data.exercises.length}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Texte */}
        <div style={{ background:C.card, borderRadius:16, padding:18, border:`1px solid ${C.border}`, lineHeight:2, fontSize:15 }}>
          {parseText(ex.text, ex.blanks, fills, clearBlank, answered)}
        </div>
        {/* Banque de mots */}
        <div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Banque de mots</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {wordBank.map(w => {
              const used = usedWords.includes(w);
              return (
                <button key={w} onClick={() => !used && !answered && pick(w)} style={{
                  background: used ? 'rgba(255,255,255,.04)' : C.surface,
                  color: used ? C.muted : C.ink, border: `1px solid ${used ? C.border : C.primary}`,
                  borderRadius:999, padding:'6px 14px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:12,
                  cursor: used||answered ? 'default' : 'pointer', opacity: used ? 0.5 : 1, textDecoration: used?'line-through':'none'
                }}>{w}</button>
              );
            })}
          </div>
        </div>
        {!answered ? (
          <button onClick={validate} disabled={!allFilled} style={{ background: allFilled?C.primary:'rgba(255,255,255,.08)', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor: allFilled?'pointer':'default' }}>Valider</button>
        ) : (
          <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
            {exIdx+1 < data.exercises.length ? 'Exercice suivant →' : 'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}