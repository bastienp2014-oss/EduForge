import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { reelCount:3, maxSpins:3 },
  reels: [
    { id:'r1', items:['ACH','MAG','POG','TUQ','CHU','FRE'] },
    { id:'r2', items:['AL','AS','NER','UE','M','TTE'] },
    { id:'r3', items:['ER','ER','','UE','',''] },
  ],
  validCombinations: [
    { combo:['ACH','AL','ER'],  result:'ACHALER',        definition:'Agacer, énerver quelqu'un', points:60 },
    { combo:['MAG','AS','NER'], result:'MAGASINER',      definition:'Faire du shopping',          points:80 },
    { combo:['POG','NER',''],   result:'POGNER',         definition:'Attraper, saisir',           points:50 },
    { combo:['TUQ','UE',''],    result:'TUQUE',          definition:'Bonnet de laine',            points:40 },
    { combo:['CHU','M',''],     result:'CHUM',           definition:'Ami ou copain',              points:40 },
    { combo:['FRE','TTE',''],   result:'FRETTE',         definition:'Très froid',                 points:50 },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

export default function CombinationBuilder({ data = SAMPLE, onBack, onComplete }) {
  const reels = data.reels;
  const [positions, setPositions] = useState(reels.map(() => 0));
  const [held, setHeld] = useState(reels.map(() => false));
  const [spinning, setSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(data.config?.maxSpins || 3);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const currentCombo = positions.map((p,i) => reels[i].items[p]);

  const checkCombo = useCallback((pos) => {
    const combo = pos.map((p,i) => reels[i].items[p]);
    return data.validCombinations.find(v => v.combo.every((c,i) => c===combo[i]));
  }, [reels, data.validCombinations]);

  const spin = useCallback(() => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setResult(null);
    let iters = 0;
    const iv = setInterval(() => {
      setPositions(pos => pos.map((p,i) => held[i] ? p : Math.floor(Math.random()*reels[i].items.length)));
      if (++iters > 12) {
        clearInterval(iv);
        setSpinning(false);
        const newSpins = spinsLeft-1;
        setSpinsLeft(newSpins);
        setPositions(pos => {
          const match = checkCombo(pos);
          if (match) { setResult({ win:true, ...match }); setScore(s=>s+match.points); onComplete?.(score+match.points); }
          else if (newSpins<=0) { setResult({ win:false }); }
          return pos;
        });
      }
    }, 80);
  }, [spinning, spinsLeft, held, reels, checkCombo, score, onComplete]);

  const toggleHold = (i) => {
    if (spinning || spinsLeft<=0 || result?.win) return;
    setHeld(h => h.map((v,idx) => idx===i?!v:v));
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎰</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Loto-Vocab 🎰</span>
        <span style={{ fontSize:12, color:C.muted }}>{spinsLeft} tours · {score} pts</span>
      </div>
      <div style={{ flex:1, padding:'32px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
        {/* Reels */}
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          {reels.map((reel, i) => (
            <div key={reel.id} onClick={() => toggleHold(i)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div style={{ width:80, height:80, borderRadius:16, background: spinning && !held[i] ? C.surface : C.card, border:`2px solid ${held[i]?C.success:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color:C.ink, transition:'border-color .15s' }}>
                {reel.items[positions[i]] || '—'}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:held[i]?C.success:C.muted, textTransform:'uppercase' }}>{held[i]?'🔒 Tenu':'Tap tenir'}</div>
            </div>
          ))}
        </div>
        {/* Résultat */}
        {result && (
          <div style={{ background: result.win?'rgba(45,122,79,.15)':'rgba(192,57,43,.1)', borderRadius:16, padding:16, border:`1px solid ${result.win?C.success:C.danger}`, textAlign:'center', width:'100%', maxWidth:340 }}>
            {result.win ? (
              <>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:20, color:C.success, marginBottom:4 }}>🎉 {result.result} !</div>
                <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>{result.definition}</div>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color:'#F5C542' }}>+{result.points} pts</div>
                <button onClick={() => setDone(true)} style={{ marginTop:12, background:C.primary, color:'#fff', border:'none', borderRadius:12, padding:'10px 24px', fontFamily:'Sora,sans-serif', fontWeight:700, cursor:'pointer' }}>Terminer</button>
              </>
            ) : (
              <>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color:C.danger, marginBottom:8 }}>Aucune combinaison valide</div>
                <button onClick={() => setDone(true)} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:12, padding:'10px 24px', fontFamily:'Sora,sans-serif', fontWeight:700, cursor:'pointer' }}>Terminer</button>
              </>
            )}
          </div>
        )}
        {/* Spin button */}
        {!result && (
          <button onClick={spin} disabled={spinning||spinsLeft<=0} style={{
            background: spinsLeft>0?C.primary:'rgba(255,255,255,.08)', color:'#fff', border:'none', borderRadius:20,
            padding:'18px 48px', fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:18, cursor: spinsLeft>0?'pointer':'default',
            boxShadow: spinsLeft>0?'0 4px 20px rgba(199,91,57,.4)':'none'
          }}>
            {spinning ? '🎰 …' : `Tourner (${spinsLeft} restants)`}
          </button>
        )}
        {/* Combinaisons valides */}
        <div style={{ width:'100%', maxWidth:340 }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Combinaisons possibles</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {data.validCombinations.map(v => (
              <div key={v.result} style={{ background:C.card, borderRadius:999, padding:'4px 10px', fontSize:11, fontWeight:700, color:C.muted, border:`1px solid ${C.border}` }}>{v.result}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}