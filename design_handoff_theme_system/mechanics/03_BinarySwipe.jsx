import React, { useState, useRef, useCallback } from 'react';

const SAMPLE = {
  config: { left:{ label:'Joual', emoji:'🗣️', color:'#2D7A4F' }, right:{ label:'Anglicisme', emoji:'🇬🇧', color:'#2B5AA0' } },
  cards: [
    { id:'s1', text:'Pogner',      answer:'left',  explanation:'Verbe populaire québécois = attraper.' },
    { id:'s2', text:'Le chum',     answer:'left',  explanation:'Québécois = ami/copain.' },
    { id:'s3', text:'Checker',     answer:'right', explanation:'De l'anglais "to check" = vérifier.' },
    { id:'s4', text:'Canceller',   answer:'right', explanation:'De l'anglais "to cancel" = annuler.' },
    { id:'s5', text:'Magasiner',   answer:'left',  explanation:'Québécois = faire du shopping.' },
    { id:'s6', text:'Parker',      answer:'right', explanation:'De l'anglais "to park" = se garer.' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', ink:'#fff', muted:'rgba(255,255,255,.5)', border:'rgba(255,255,255,.1)', primary:'#C75B39' };

export default function BinarySwipe({ data = SAMPLE, onBack, onComplete }) {
  const left = data.config.left, right = data.config.right;
  const cards = data.cards;
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [dx, setDx] = useState(0);
  const [result, setResult] = useState(null); // 'correct'|'wrong'
  const [done, setDone] = useState(false);
  const [lastAnswer, setLastAnswer] = useState(null);
  const touchStart = useRef(null);

  const card = cards[idx];
  const swipeSide = dx > 60 ? 'right' : dx < -60 ? 'left' : null;

  const commit = useCallback((side) => {
    const correct = side === card.answer;
    setLastAnswer({ side, correct, explanation: card.explanation });
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s+1);
    setTimeout(() => {
      setResult(null); setLastAnswer(null); setDx(0);
      if (idx+1 >= cards.length) { setDone(true); onComplete?.(score*25); }
      else setIdx(i => i+1);
    }, 1100);
  }, [card, idx, cards.length, score, onComplete]);

  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchMove = (e) => {
    if (!touchStart.current || result) return;
    setDx(e.touches[0].clientX - touchStart.current);
  };
  const onTouchEnd = () => {
    if (result) return;
    if (dx > 80) commit('right');
    else if (dx < -80) commit('left');
    else setDx(0);
    touchStart.current = null;
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎯</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{score}/{cards.length} correct</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score*25} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  const rotation = dx * 0.08;
  const opacity = result ? (result==='correct' ? 1 : 0.4) : 1;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Swipe</span>
        <span style={{ fontSize:12, color:C.muted }}>⭐ {score}</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:20 }}>
        {/* Indicateurs */}
        <div style={{ display:'flex', width:'100%', maxWidth:340, justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color: dx<-30 ? left.color : C.muted, transition:'color .15s' }}>{left.emoji} {left.label}</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color: dx>30 ? right.color : C.muted, transition:'color .15s' }}>{right.label} {right.emoji}</div>
        </div>
        {/* Card */}
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{
            width:'100%', maxWidth:340, minHeight:180,
            background: result==='correct' ? C.card : result==='wrong' ? '#2a1010' : C.card,
            borderRadius:22, border:`2px solid ${result==='correct' ? '#2D7A4F' : result==='wrong' ? '#c0392b' : 'rgba(255,255,255,.1)'}`,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:28,
            transform:`translateX(${dx}px) rotate(${rotation}deg)`,
            transition: dx===0 ? 'transform .3s, border-color .2s' : 'border-color .2s',
            boxShadow:'0 8px 32px rgba(0,0,0,.3)', userSelect:'none', cursor:'grab', opacity
          }}>
          {result ? (
            <>
              <div style={{ fontSize:36, marginBottom:8 }}>{result==='correct' ? '✓' : '✗'}</div>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, color:C.ink, marginBottom:8 }}>{result==='correct' ? 'Correct !' : 'Mauvais'}</div>
              {lastAnswer?.explanation && <div style={{ fontSize:12, color:C.muted, textAlign:'center' }}>{lastAnswer.explanation}</div>}
            </>
          ) : (
            <>
              <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:C.ink, textAlign:'center' }}>{card.text}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:16 }}>← glisse pour classer →</div>
            </>
          )}
        </div>
        {/* Boutons fallback */}
        <div style={{ display:'flex', gap:12, width:'100%', maxWidth:340 }}>
          <button onClick={() => !result && commit('left')} style={{ flex:1, background:left.color, color:'#fff', border:'none', borderRadius:12, padding:'12px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>{left.emoji} {left.label}</button>
          <button onClick={() => !result && commit('right')} style={{ flex:1, background:right.color, color:'#fff', border:'none', borderRadius:12, padding:'12px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>{right.emoji} {right.label}</button>
        </div>
        <div style={{ fontSize:11, color:C.muted }}>{idx+1}/{cards.length} cartes</div>
      </div>
    </div>
  );
}