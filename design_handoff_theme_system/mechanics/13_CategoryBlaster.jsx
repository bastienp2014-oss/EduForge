import React, { useState, useEffect, useCallback, useRef } from 'react';

const SAMPLE = {
  config: { baseTimeMs:3500, minTimeMs:1200, speedupFactor:0.92, comboBonus:true },
  categories: [
    { id:'joual',      label:'Joual',      emoji:'🗣️', color:'#2D7A4F' },
    { id:'anglicisme', label:'Anglicisme', emoji:'🇬🇧', color:'#2B5AA0' },
    { id:'sacre',      label:'Sacre',      emoji:'🔥', color:'#C75B39' },
  ],
  items: [
    { id:'i1',  text:'Pogner',    categoryId:'joual'      },
    { id:'i2',  text:'Checker',   categoryId:'anglicisme' },
    { id:'i3',  text:'Tabarnac',  categoryId:'sacre'      },
    { id:'i4',  text:'Magasiner', categoryId:'joual'      },
    { id:'i5',  text:'Canceller', categoryId:'anglicisme' },
    { id:'i6',  text:'Câlice',    categoryId:'sacre'      },
    { id:'i7',  text:'Chum',      categoryId:'joual'      },
    { id:'i8',  text:'Parker',    categoryId:'anglicisme' },
    { id:'i9',  text:'Estie',     categoryId:'sacre'      },
    { id:'i10', text:'Achaler',   categoryId:'joual'      },
    { id:'i11', text:'Drafter',   categoryId:'anglicisme' },
    { id:'i12', text:'Coudon',    categoryId:'joual'      },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
function shuffle(arr) { return [...arr].sort(()=>Math.random()-.5); }

export default function CategoryBlaster({ data = SAMPLE, onBack, onComplete }) {
  const items = useRef(shuffle(data.items));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1);
  const [timeMax, setTimeMax] = useState(data.config?.baseTimeMs || 3500);
  const [feedback, setFeedback] = useState(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const startTimer = useCallback((ms) => {
    setTimeLeft(ms);
    setTimeMax(ms);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 50) {
          clearInterval(timerRef.current);
          // Time's up = wrong
          setFeedback({ correct:false, label:'⏱ Temps !' });
          setCombo(0);
          setTimeout(() => {
            setFeedback(null);
            setIdx(i => {
              const ni = i+1;
              if (ni >= items.current.length) { setDone(true); return i; }
              const nextMs = Math.max(ms * (data.config?.speedupFactor||.92), data.config?.minTimeMs||1200);
              startTimer(nextMs);
              return ni;
            });
          }, 800);
          return 0;
        }
        return t - 50;
      });
    }, 50);
  }, [data.config]);

  useEffect(() => {
    startTimer(data.config?.baseTimeMs || 3500);
    return () => clearInterval(timerRef.current);
  }, []);

  const pick = useCallback((catId) => {
    if (feedback) return;
    clearInterval(timerRef.current);
    const item = items.current[idx];
    const correct = item.categoryId === catId;
    const newCombo = correct ? combo+1 : 0;
    const pts = correct ? (10 + (data.config?.comboBonus && newCombo>=3 ? newCombo*5 : 0)) : 0;
    setScore(s => s+pts);
    setCombo(newCombo);
    setFeedback({ correct, label: correct ? (newCombo>=3 ? `🔥 COMBO x${newCombo}!` : '✓ Correct !') : '✗ Mauvais' });
    setTimeout(() => {
      setFeedback(null);
      const ni = idx+1;
      if (ni >= items.current.length) { setDone(true); onComplete?.(score+pts); return; }
      setIdx(ni);
      const nextMs = Math.max(timeMax * (data.config?.speedupFactor||.92), data.config?.minTimeMs||1200);
      startTimer(nextMs);
    }, 700);
  }, [feedback, idx, combo, score, timeMax, data.config, startTimer, onComplete]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>⚡</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{score} points !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>{items.current.length} items classés</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  const item = items.current[idx];
  const pct = timeMax > 0 ? (timeLeft/timeMax)*100 : 0;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Blaster</span>
        <span style={{ fontSize:12, color:C.muted }}>⭐ {score} {combo>=3?'🔥':''}</span>
      </div>
      {/* Timer bar */}
      <div style={{ height:6, background:C.border, transition:'none' }}>
        <div style={{ height:6, background: pct>50?C.success:pct>25?'#f59e0b':C.danger, width:`${pct}%`, transition:'width .05s linear' }} />
      </div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        {/* Item card */}
        <div style={{ width:'100%', maxWidth:340, background:feedback?(feedback.correct?'rgba(45,122,79,.15)':'rgba(192,57,43,.12)'):C.card, borderRadius:22, border:`2px solid ${feedback?(feedback.correct?C.success:C.danger):C.border}`, padding:'36px 20px', textAlign:'center', transition:'all .15s', minHeight:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {feedback ? (
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:20, color:feedback.correct?C.success:C.danger }}>{feedback.label}</div>
          ) : (
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:30, color:C.ink }}>{item.text}</div>
          )}
        </div>
        <div style={{ fontSize:11, color:C.muted }}>{idx+1}/{items.current.length} · Combo: {combo}</div>
        {/* Catégories */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:340 }}>
          {data.categories.map(cat => (
            <button key={cat.id} onClick={() => pick(cat.id)} style={{
              background:`${cat.color}22`, border:`2px solid ${cat.color}66`,
              borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:14,
              fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:16, color:C.ink, cursor:'pointer'
            }}>
              <span style={{ fontSize:24 }}>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}