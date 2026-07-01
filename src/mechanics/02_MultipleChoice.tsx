import { useTheme } from '../store/useTheme';
import React, { useState, useEffect } from 'react';
import { BaseGameProps } from '../types';
import { MultipleChoiceData } from '../types/mechanics';

export default function MultipleChoice({ items, onBack, onComplete, onResponse, isEmbedded, data }: BaseGameProps & { data?: MultipleChoiceData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const timer = data?.config?.timer || 20; // Use timer from data
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [done, setDone] = useState(false);

  const currentItem = items[idx];
  const totalXP = score * 30;

  useEffect(() => {
    if (answered || done || !items || items.length === 0) return;
    setTimeLeft(timer);
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(iv); setAnswered(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [idx, answered, done, timer, items]);

  if (!items || items.length === 0) {
    return <div className="p-4" style={{color: C.ink}}>Aucune donnée pour ce jeu.</div>;
  }

  const select = (choice: string) => {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
    
    const isCorrect = choice === currentItem.payload.answer;
    if (isCorrect) {
        setScore(s => s + 1);
        onResponse?.(currentItem.id, 3); // Easy/Correct
    } else {
        onResponse?.(currentItem.id, 1); // Hard/Wrong
    }
  };

  const next = () => {
    if (idx + 1 >= items.length) { setDone(true); onComplete?.(totalXP); }
    else { setIdx(i => i+1); setSelected(null); setAnswered(false); }
  };

  const choiceColor = (choice: string) => {
    if (!answered) return C.surface;
    if (choice === currentItem.payload.answer) return C.success;
    if (choice === selected && choice !== currentItem.payload.answer) return C.danger;
    return C.surface;
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🏆</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{score}/{items.length} bonnes réponses</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{totalXP} pts</div>
      <button onClick={onBack} style={btnS(C.primary)}>Retour</button>
    </div>
  );

  const options = currentItem.payload.options || [currentItem.payload.answer]; // Fallback if no options

  return (
    <div style={{ background:C.bg, minHeight: isEmbedded ? '100%' : '100vh', display:'flex', flexDirection:'column' }}>
      <div style={hud}>
        <button onClick={onBack} style={back}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Quiz</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{items.length}</span>
      </div>
      {/* Timer */}
      <div style={{ height:4, background:C.border }}>
        <div style={{ height:4, background: timeLeft > timer*0.4 ? C.success : C.danger, width:`${(timeLeft/timer)*100}%`, transition:'width 1s linear' }} />
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Question */}
        <div style={{ background:C.surface, borderRadius:18, padding:20, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>Question {idx+1}</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:17, color:C.ink, lineHeight:1.5 }}>{currentItem.payload.question || currentItem.payload.translation || "Quelle est la bonne réponse ?"}</div>
          <div style={{ marginTop:10, fontSize:13, color: timeLeft <= 5 ? C.danger : C.muted, fontWeight:700 }}>⏱ {timeLeft}s</div>
        </div>
        {/* Choices */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {options.map((choice: string, i: number) => (
            <button key={i} onClick={() => select(choice)} style={{
              background:choiceColor(choice), border:`1px solid ${answered && choice === currentItem.payload.answer ? C.success : C.border}`,
              borderRadius:14, padding:'14px 16px', cursor: answered ? 'default' : 'pointer',
              textAlign:'left', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, color:C.ink, transition:'background .2s'
            }}>
              {answered && choice === currentItem.payload.answer && '✓ '}{answered && choice === selected && choice !== currentItem.payload.answer && '✗ '}{choice}
            </button>
          ))}
        </div>
        {/* Explanation */}
        {answered && currentItem.payload.exemple && (
          <div style={{ background:'rgba(255,255,255,.05)', borderRadius:14, padding:14, fontSize:13, color:C.muted, lineHeight:1.6 }}>
            💡 {currentItem.payload.exemple}
          </div>
        )}
        {answered && (
          <button onClick={next} style={btnS(C.primary)}>{idx+1<items.length ? 'Question suivante →' : 'Voir résultats'}</button>
        )}
      </div>
    </div>
  );
}
const hud: React.CSSProperties = { background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' };
const back: React.CSSProperties = { background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 };
const btnS = (bg: string): React.CSSProperties => ({ background:bg, color:'#fff', border:'none', borderRadius:14, padding:'14px 20px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', width:'100%', marginTop:4 });