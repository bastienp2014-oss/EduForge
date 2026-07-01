import React, { useState, useRef, useCallback } from 'react';

const SAMPLE = {
  config: { criterion:'La prononciation québécoise native', shuffleAB:true, unlimitedReplays:true },
  pairs: [
    { id:'p1', label:'Aweille', audioA:'', audioB:'', correct:'A', explanation:'Version A = joual québécois avec diphtongaison et élision.' },
    { id:'p2', label:'C'est tiguidou', audioA:'', audioB:'', correct:'B', explanation:'Version B = intonation montante typiquement québécoise.' },
    { id:'p3', label:'Pantoute',  audioA:'', audioB:'', correct:'A', explanation:'Version A = nasalisation et rythme québécois accentués.' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

export default function AudioAB({ data = SAMPLE, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const audioA = useRef(null);
  const audioB = useRef(null);

  const pair = data.pairs[idx];
  const answered = picked !== null;

  const playClip = (which) => {
    setPlaying(which);
    const ref = which==='A' ? audioA : audioB;
    if (ref.current && pair[`audio${which}`]) {
      ref.current.play();
      ref.current.onended = () => setPlaying(null);
    } else {
      setTimeout(() => setPlaying(null), 1500);
    }
  };

  const pick = (which) => {
    if (answered) return;
    setPicked(which);
    const correct = which === pair.correct;
    if (correct) setScore(s=>s+30);
  };

  const next = () => {
    if (idx+1 >= data.pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); setPlaying(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>👂</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Oreille exercée !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  const isCorrect = (w) => answered && w===pair.correct;
  const isWrong   = (w) => answered && picked===w && w!==pair.correct;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Comparaison A/B</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{data.pairs.length}</span>
      </div>
      {pair.audioA && <audio ref={audioA} src={pair.audioA} />}
      {pair.audioB && <audio ref={audioB} src={pair.audioB} />}
      <div style={{ flex:1, padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        {/* Critère */}
        <div style={{ background:C.card, borderRadius:16, padding:'14px 18px', border:`1px solid ${C.border}`, textAlign:'center', width:'100%', maxWidth:340 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Critère</div>
          <div style={{ fontSize:13, color:C.ink, fontWeight:600 }}>{data.config?.criterion}</div>
        </div>
        {/* Label */}
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink }}>{pair.label}</div>
        {/* Clips A et B */}
        <div style={{ display:'flex', gap:16, width:'100%', maxWidth:340 }}>
          {['A','B'].map(w => (
            <div key={w} style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => playClip(w)} style={{
                background:playing===w?'rgba(199,91,57,.2)':C.surface, border:`2px solid ${playing===w?C.primary:C.border}`,
                borderRadius:14, padding:'20px 10px', fontSize:24, cursor:'pointer', textAlign:'center'
              }}>{playing===w?'⏸':'▶'}</button>
              <button onClick={() => pick(w)} disabled={answered} style={{
                background: isCorrect(w)?'rgba(45,122,79,.2)':isWrong(w)?'rgba(192,57,43,.15)':C.card,
                border:`2px solid ${isCorrect(w)?C.success:isWrong(w)?C.danger:C.border}`,
                borderRadius:12, padding:'10px 0', fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color:C.ink, cursor:answered?'default':'pointer'
              }}>Version {w}</button>
            </div>
          ))}
        </div>
        {answered && (
          <>
            <div style={{ background:'rgba(255,255,255,.05)', borderRadius:14, padding:14, border:`1px solid rgba(255,255,255,.08)`, width:'100%', maxWidth:340, textAlign:'center' }}>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:picked===pair.correct?C.success:C.danger, marginBottom:6 }}>
                {picked===pair.correct?'✓ Bonne oreille !':'✗ Version '+pair.correct+' était la bonne'}
              </div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{pair.explanation}</div>
            </div>
            <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', width:'100%', maxWidth:340 }}>
              {idx+1<data.pairs.length?'Paire suivante →':'Voir résultats'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}