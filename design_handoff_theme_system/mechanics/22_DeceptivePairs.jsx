import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { contextA:'Français standard', contextB:'Québécois' },
  pairs: [
    { id:'dp1', term:'Sensible', meaningA:'Qui ressent facilement les émotions', choices:[
      { id:'a', text:'Raisonnable, logique', correct:true,  isMeaningA:false },
      { id:'b', text:'Émotif, très sensible', correct:false, isMeaningA:true  },
    ], explanation:'En anglais "sensible" = raisonnable. "Sensitive" = sensible en français.', etymology:'Du latin sensibilis — évolution divergente sur 500 ans.' },
    { id:'dp2', term:'Déceptif', meaningA:'Qui crée une illusion (optique déceptive)', choices:[
      { id:'a', text:'Décevant, qui déçoit',  correct:true,  isMeaningA:false },
      { id:'b', text:'Trompeur, illusoire',   correct:false, isMeaningA:true  },
    ], explanation:'En québécois, "déceptif" a glissé vers "décevant" par calque de l'anglais "deceptive".', etymology:'Faux ami classique franco-anglais.' },
    { id:'dp3', term:'Achaler', meaningA:'Agacer, importuner (québécois)', choices:[
      { id:'a', text:'Agacer, déranger quelqu'un', correct:false, isMeaningA:true },
      { id:'b', text:'N'existe pas en français standard', correct:true, isMeaningA:false },
    ], explanation:'Achaler n'existe qu'en québécois — calque de l'anglais "to harass". Absent du français hexagonal.', etymology:'De l'anglais to harass / to hale.' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

export default function DeceptivePairs({ data = SAMPLE, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const pair = data.pairs[idx];
  const answered = picked !== null;
  const pickedChoice = pair.choices.find(c=>c.id===picked);

  const pick = useCallback((choice) => {
    if (answered) return;
    setPicked(choice.id);
    if (choice.correct) setScore(s=>s+35);
  }, [answered]);

  const next = () => {
    if (idx+1 >= data.pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🤥</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Faux amis démasqués !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Faux Amis</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{data.pairs.length}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Mot + contexte A */}
        <div style={{ background:C.card, borderRadius:18, padding:20, border:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:C.ink, marginBottom:10 }}>{pair.term}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ background:'rgba(43,90,160,.25)', borderRadius:999, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#93c5fd' }}>{data.config?.contextA}</div>
          </div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, fontStyle:'italic' }}>"{pair.meaningA}"</div>
        </div>
        {/* Question */}
        <div style={{ fontSize:13, color:C.primary, fontWeight:700, textAlign:'center' }}>
          Que signifie <strong>"{pair.term}"</strong> en <span style={{ background:'rgba(199,91,57,.2)', borderRadius:4, padding:'1px 6px' }}>{data.config?.contextB}</span> ?
        </div>
        {/* Choix */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pair.choices.map(c => {
            const isCorrect = answered && c.correct;
            const isWrong = answered && c.id===picked && !c.correct;
            return (
              <button key={c.id} onClick={() => pick(c)} style={{
                background: isCorrect?'rgba(45,122,79,.2)':isWrong?'rgba(192,57,43,.15)':C.surface,
                border:`2px solid ${isCorrect?C.success:isWrong?C.danger:C.border}`,
                borderRadius:14, padding:'14px 16px', textAlign:'left',
                fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, color:C.ink, cursor:answered?'default':'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:10
              }}>
                {c.isMeaningA && <span style={{ fontSize:10, background:'rgba(99,102,241,.2)', color:'#a5b4fc', borderRadius:4, padding:'2px 6px', fontWeight:700, flexShrink:0 }}>⚠️ Piège</span>}
                <span>{isCorrect?'✓ ':isWrong?'✗ ':''}{c.text}</span>
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <div style={{ background:'rgba(255,255,255,.04)', borderRadius:14, padding:14, border:`1px solid rgba(255,255,255,.08)` }}>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:6 }}>💡 {pair.explanation}</div>
              {pair.etymology && <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>📜 {pair.etymology}</div>}
            </div>
            <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {idx+1<data.pairs.length?'Paire suivante →':'Voir résultats'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}