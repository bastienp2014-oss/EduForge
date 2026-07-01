import React, { useState, useEffect, useCallback } from 'react';

const SAMPLE = {
  config: { timerSeconds: 15, shuffle: true, showExplanation: true },
  questions: [
    { id:'q1', question:'Que signifie "achaler" en québécois ?', choices:[
      {id:'a',text:'Acheter',correct:false},{id:'b',text:'Agacer',correct:true},
      {id:'c',text:'Appeler',correct:false},{id:'d',text:'Attendre',correct:false}],
      explanation:'Achaler vient de l'anglais "harass" et signifie agacer, déranger.' },
    { id:'q2', question:'Comment dit-on "gant de toilette" au Québec ?', choices:[
      {id:'a',text:'Lavette',correct:false},{id:'b',text:'Flanelle',correct:false},
      {id:'c',text:'Débarbouillette',correct:true},{id:'d',text:'Mitaine',correct:false}],
      explanation:'Débarbouillette est typiquement québécois. En France on dit "gant de toilette".' },
    { id:'q3', question:'Que veut dire "magasiner" ?', choices:[
      {id:'a',text:'Travailler en magasin',correct:false},{id:'b',text:'Faire du shopping',correct:true},
      {id:'c',text:'Trier des vêtements',correct:false},{id:'d',text:'Livrer des colis',correct:false}],
      explanation:'Magasiner = faire les magasins, faire du shopping. Verbe typiquement québécois.' },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.5)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };

export default function MultipleChoice({ data = SAMPLE, onBack, onComplete }) {
  const questions = data.questions;
  const timer = data.config?.timerSeconds || 20;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const totalXP = score * 30;

  useEffect(() => {
    if (answered || done) return;
    setTimeLeft(timer);
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(iv); setAnswered(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [idx, answered, done, timer]);

  const select = (choice) => {
    if (answered) return;
    setSelected(choice.id);
    setAnswered(true);
    if (choice.correct) setScore(s => s + 1);
  };

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); onComplete?.(totalXP); }
    else { setIdx(i => i+1); setSelected(null); setAnswered(false); }
  };

  const choiceColor = (c) => {
    if (!answered) return C.surface;
    if (c.correct) return C.success;
    if (c.id === selected && !c.correct) return C.danger;
    return C.surface;
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🏆</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{score}/{questions.length} bonnes réponses</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{totalXP} pts</div>
      <button onClick={onBack} style={btnS(C.primary)}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={hud}>
        <button onClick={onBack} style={back}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Quiz</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{questions.length}</span>
      </div>
      {/* Timer */}
      <div style={{ height:4, background:C.border }}>
        <div style={{ height:4, background: timeLeft > timer*0.4 ? C.success : C.danger, width:`${(timeLeft/timer)*100}%`, transition:'width 1s linear' }} />
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Question */}
        <div style={{ background:C.card, borderRadius:18, padding:20, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>Question {idx+1}</div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:17, color:C.ink, lineHeight:1.5 }}>{q.question}</div>
          <div style={{ marginTop:10, fontSize:13, color: timeLeft <= 5 ? C.danger : C.muted, fontWeight:700 }}>⏱ {timeLeft}s</div>
        </div>
        {/* Choices */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {q.choices.map(c => (
            <button key={c.id} onClick={() => select(c)} style={{
              background:choiceColor(c), border:`1px solid ${answered && c.correct ? C.success : C.border}`,
              borderRadius:14, padding:'14px 16px', cursor: answered ? 'default' : 'pointer',
              textAlign:'left', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, color:C.ink, transition:'background .2s'
            }}>
              {answered && c.correct && '✓ '}{answered && c.id===selected && !c.correct && '✗ '}{c.text}
            </button>
          ))}
        </div>
        {/* Explanation */}
        {answered && data.config?.showExplanation && q.explanation && (
          <div style={{ background:'rgba(255,255,255,.05)', borderRadius:14, padding:14, fontSize:13, color:C.muted, lineHeight:1.6 }}>
            💡 {q.explanation}
          </div>
        )}
        {answered && (
          <button onClick={next} style={btnS(C.primary)}>{idx+1<questions.length ? 'Question suivante →' : 'Voir résultats'}</button>
        )}
      </div>
    </div>
  );
}
const hud = { background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' };
const back = { background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 };
const btnS = (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:14, padding:'14px 20px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', width:'100%', marginTop:4 });