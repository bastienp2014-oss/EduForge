import React, { useState, useCallback } from 'react';

const SAMPLE = {
  scenarios: [
    {
      id:'sc1',
      situation:'Tu arrives en retard au travail et ton patron te regarde d'un air mécontent.',
      question:'Que dis-tu en québécois pour t'excuser ?',
      choices:[
        { id:'a', text:'Je suis vraiment désolé, j'ai eu un empêchement.', correct:false, register:'formal', feedback:'Correct en français standard, mais un peu guindé pour le Québec.' },
        { id:'b', text:'Excuse-moé, j'ai eu du trouble en chemin !', correct:true, register:'casual', feedback:'Parfait ! "Trouble" = problème, "excuse-moé" = excuse-moi en joual.' },
        { id:'c', text:'Wô ! J'arrive, j'arrive !', correct:false, register:'casual', feedback:'Trop désinvolte pour s'adresser à son patron.' },
      ]
    },
    {
      id:'sc2',
      situation:'Ton ami t'offre une bière et tu veux refuser poliment.',
      question:'Comment décliner en québécois ?',
      choices:[
        { id:'a', text:'Non merci, je suis correct de même.', correct:true, register:'casual', feedback:'"Être correct" = être satisfait, aller bien. Très québécois !' },
        { id:'b', text:'Je ne désire pas de bière, merci.', correct:false, register:'formal', feedback:'Trop formel pour ce contexte social détendu.' },
        { id:'c', text:'Pantoute ! J'en veux pas.', correct:false, register:'casual', feedback:'"Pantoute" est correct mais un peu brusque pour refuser poliment.' },
      ]
    },
    {
      id:'sc3',
      situation:'Tu demandes à quelqu'un comment il va, et il te répond bien.',
      question:'Quelle réponse typiquement québécoise attendrais-tu ?',
      choices:[
        { id:'a', text:'Je vais très bien, merci de demander.', correct:false, register:'formal', feedback:'Réponse correcte mais très formelle, peu naturelle au Québec.' },
        { id:'b', text:'Ça va, pis toé ?', correct:true, register:'casual', feedback:'Très naturel ! "Pis toé ?" = "Et toi ?" en joual québécois.' },
        { id:'c', text:'Je suis en pleine forme, merci !', correct:false, register:'formal', feedback:'Naturel mais peu caractéristique du registre québécois courant.' },
      ]
    },
  ]
};

const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
const REGISTER_COLORS = { formal:'#2B5AA0', casual:'#2D7A4F', wrong:'#c0392b' };

export default function SituationalChoice({ data = SAMPLE, onBack, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const sc = data.scenarios[idx];
  const answered = picked !== null;

  const pick = useCallback((choice) => {
    if (answered) return;
    setPicked(choice.id);
    if (choice.correct) setScore(s=>s+30);
  }, [answered]);

  const next = () => {
    if (idx+1 >= data.scenarios.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  const choiceBg = (c) => {
    if (!answered) return C.surface;
    if (c.correct) return 'rgba(45,122,79,.2)';
    if (c.id===picked) return 'rgba(192,57,43,.15)';
    return 'rgba(255,255,255,.03)';
  };
  const choiceBorder = (c) => {
    if (!answered) return C.border;
    if (c.correct) return C.success;
    if (c.id===picked && !c.correct) return C.danger;
    return 'rgba(255,255,255,.05)';
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎭</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Scénarios terminés !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Situation</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{data.scenarios.length}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Situation */}
        <div style={{ background:C.card, borderRadius:16, padding:18, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>🎭 Situation</div>
          <p style={{ fontSize:14, color:C.ink, lineHeight:1.65, margin:'0 0 10px' }}>{sc.situation}</p>
          <p style={{ fontSize:13, color:C.primary, fontWeight:700, margin:0 }}>{sc.question}</p>
        </div>
        {/* Choix */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {sc.choices.map(c => (
            <button key={c.id} onClick={() => pick(c)} style={{
              background:choiceBg(c), border:`2px solid ${choiceBorder(c)}`,
              borderRadius:14, padding:'14px 16px', textAlign:'left', cursor: answered?'default':'pointer',
              transition:'all .2s'
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                <div style={{ fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, color:C.ink, lineHeight:1.5 }}>{c.text}</div>
                <div style={{ background:`${REGISTER_COLORS[c.register]}33`, color:REGISTER_COLORS[c.register], borderRadius:999, padding:'2px 8px', fontSize:9, fontWeight:700, textTransform:'uppercase', flexShrink:0 }}>{c.register}</div>
              </div>
              {answered && c.id===picked && (
                <div style={{ marginTop:8, fontSize:12, color:c.correct?C.success:C.danger, lineHeight:1.5 }}>{c.feedback}</div>
              )}
              {answered && c.correct && c.id!==picked && (
                <div style={{ marginTop:8, fontSize:12, color:C.success, lineHeight:1.5 }}>✓ {c.feedback}</div>
              )}
            </button>
          ))}
        </div>
        {answered && (
          <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
            {idx+1<data.scenarios.length ? 'Scénario suivant →' : 'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}