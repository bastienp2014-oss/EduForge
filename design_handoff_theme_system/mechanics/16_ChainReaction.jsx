import React, { useState, useEffect, useRef, useCallback } from 'react';

const SAMPLE = {
  config: { linkType:'letter', timerSeconds:8 },
  wordBank: [
    { id:'g1', word:'ACHALER',    startLetter:'A', endLetter:'R' },
    { id:'g2', word:'RONDELLE',   startLetter:'R', endLetter:'E' },
    { id:'g3', word:'ESTIE',      startLetter:'E', endLetter:'E' },
    { id:'g4', word:'EMBARQUER',  startLetter:'E', endLetter:'R' },
    { id:'g5', word:'RAVIGOTE',   startLetter:'R', endLetter:'E' },
    { id:'g6', word:'ESCOGRIFFE', startLetter:'E', endLetter:'E' },
    { id:'g7', word:'RALLER',     startLetter:'R', endLetter:'R' },
    { id:'g8', word:'RIGOLER',    startLetter:'R', endLetter:'R' },
    { id:'g9', word:'MAGASINER',  startLetter:'M', endLetter:'R' },
    { id:'g10',word:'POUDRERIE',  startLetter:'P', endLetter:'E' },
    { id:'g11',word:'TABARNAC',   startLetter:'T', endLetter:'C' },
    { id:'g12',word:'CÂLICE',     startLetter:'C', endLetter:'E' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

export default function ChainReaction({ data = SAMPLE, onBack, onComplete }) {
  const timer = data.config?.timerSeconds || 8;
  const [chain, setChain] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timer);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [usedIds, setUsedIds] = useState(new Set());
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const startWord = data.wordBank[Math.floor(Math.random()*data.wordBank.length)];
  const [firstWord] = useState(startWord);

  useEffect(() => {
    if (done) return;
    setTimeLeft(timer);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setDone(true); onComplete?.(chain.length*20); return 0; }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [chain.length, done]);

  const lastWord = chain.length > 0 ? chain[chain.length-1] : firstWord;
  const neededLetter = lastWord.endLetter;

  const submit = useCallback(() => {
    const val = input.toUpperCase().trim();
    if (!val) return;
    const match = data.wordBank.find(w => w.word===val && !usedIds.has(w.id) && w.startLetter===neededLetter);
    if (!match) {
      setError(val.startsWith(neededLetter) ? 'Mot non trouvé dans la banque !' : `Doit commencer par la lettre "${neededLetter}" !`);
      setTimeout(() => setError(''), 1500);
    } else {
      setChain(c => [...c, match]);
      setUsedIds(s => new Set([...s, match.id]));
      setInput('');
      setError('');
    }
  }, [input, data.wordBank, usedIds, neededLetter]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>⛓️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Chaîne de {chain.length} mots !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:20 }}>+{chain.length*20} pts</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, width:'100%', maxWidth:340, marginBottom:24 }}>
        {[firstWord,...chain].map((w,i) => (
          <div key={i} style={{ fontSize:12, color:C.muted, textAlign:'center' }}>{i===0?'🎯':'→'} {w.word}</div>
        ))}
      </div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Chaîne de mots</span>
        <span style={{ fontSize:12, color: timeLeft<=3?C.danger:C.muted, fontWeight:700 }}>⏱ {timeLeft}s</span>
      </div>
      <div style={{ height:4, background:C.border }}><div style={{ height:4, background:timeLeft>timer*.4?C.success:C.danger, width:`${(timeLeft/timer)*100}%`, transition:'width 1s linear' }}/></div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Current word */}
        <div style={{ background:C.card, borderRadius:18, padding:'20px', border:`1px solid ${C.border}`, textAlign:'center' }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Mot actuel</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:28, color:C.ink, marginBottom:8 }}>{lastWord.word}</div>
          <div style={{ fontSize:13, color:C.primary, fontWeight:700 }}>Prochain mot commence par : <span style={{ fontSize:22 }}>"{neededLetter}"</span></div>
        </div>
        {/* Input */}
        <div style={{ display:'flex', gap:8 }}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value.toUpperCase())}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            placeholder={`Mot commençant par "${neededLetter}"…`}
            style={{ flex:1, background:C.surface, border:`1px solid ${error?C.danger:C.border}`, borderRadius:12, padding:'12px 14px', color:C.ink, fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, outline:'none' }} />
          <button onClick={submit} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:12, padding:'12px 18px', fontFamily:'Sora,sans-serif', fontWeight:700, cursor:'pointer' }}>→</button>
        </div>
        {error && <div style={{ fontSize:13, color:C.danger, textAlign:'center', fontWeight:700 }}>{error}</div>}
        {/* Chain */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflow:'auto' }}>
          {[firstWord,...chain].map((w,i) => (
            <div key={i} style={{ fontSize:12, color:C.muted, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:20, textAlign:'right', color:'rgba(255,255,255,.25)' }}>{i+1}</span>
              <span style={{ width:20 }}>{i===0?'🎯':'→'}</span>
              <span style={{ fontWeight:700, color:C.ink }}>{w.word}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:C.muted, textAlign:'center' }}>Chaîne actuelle : {chain.length} mots · {chain.length*20} pts</div>
      </div>
    </div>
  );
}