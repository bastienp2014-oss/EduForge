import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { sessionSize: 5 },
  cards: [
    { id:'c1', front:{ text:'Achaler' }, back:{ text:'Agacer, déranger', explanation:'Mot québécois issu de l'anglais "harass".' } },
    { id:'c2', front:{ text:'Débarbouillette' }, back:{ text:'Gant de toilette', explanation:'Inconnu en France, courant au Québec.' } },
    { id:'c3', front:{ text:'Magasiner' }, back:{ text:'Faire du shopping', explanation:'Du français "magasin" + suffixe verbal.' } },
    { id:'c4', front:{ text:'Tuque' }, back:{ text:'Bonnet de laine', explanation:'Mot d'origine canadienne-française.' } },
    { id:'c5', front:{ text:'Pogner' }, back:{ text:'Attraper, saisir', explanation:'Contraction populaire de "poigner".' } },
  ]
};

const COLORS = {
  bg:'#0f1117', card:'#1a1d2e', surface:'#232640',
  ink:'#fff', muted:'rgba(255,255,255,.5)', border:'rgba(255,255,255,.1)',
  primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b',
  rating: ['#c0392b','#e67e22','#f1c40f','#27ae60','#1abc9c'],
  ratingLabel: ['Oublié','Difficile','Hésitant','Bon','Facile'],
};

const RATINGS = [1,2,3,4,5];

export default function FlashcardSRS({ data = SAMPLE, onBack, onComplete }) {
  const cards = data.cards.slice(0, data.config?.sessionSize || 10);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('front'); // 'front' | 'back'
  const [scores, setScores] = useState([]);
  const [done, setDone] = useState(false);

  const card = cards[idx];
  const totalXP = scores.reduce((a, r) => a + r * 15, 0);

  const flip = () => setPhase(p => p === 'front' ? 'back' : 'front');

  const rate = useCallback((r) => {
    const next = [...scores, r];
    setScores(next);
    if (idx + 1 >= cards.length) { setDone(true); onComplete?.(totalXP); }
    else { setIdx(i => i + 1); setPhase('front'); }
  }, [idx, scores, cards.length, totalXP, onComplete]);

  if (done) return (
    <div style={{ background:COLORS.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:COLORS.ink, marginBottom:8 }}>Session terminée !</div>
      <div style={{ fontSize:14, color:COLORS.muted, marginBottom:32 }}>{cards.length} cartes révisées · +{totalXP} pts</div>
      <button onClick={onBack} style={btnStyle(COLORS.primary)}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:COLORS.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* HUD */}
      <div style={hudStyle}>
        <button onClick={onBack} style={backBtn}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:COLORS.ink }}>Flashcard SRS</span>
        <span style={{ fontSize:12, color:COLORS.muted }}>{idx+1}/{cards.length}</span>
      </div>
      {/* Progress */}
      <div style={{ height:4, background:COLORS.border }}>
        <div style={{ height:4, background:COLORS.primary, width:`${((idx)/cards.length)*100}%`, transition:'width .3s' }} />
      </div>
      {/* Card */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:24 }}>
        <div onClick={flip} style={{
          width:'100%', maxWidth:340, minHeight:200, background:COLORS.card,
          borderRadius:20, border:`1px solid ${COLORS.border}`, cursor:'pointer',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:28, boxShadow:'0 8px 32px rgba(0,0,0,.3)', userSelect:'none'
        }}>
          <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:16 }}>
            {phase === 'front' ? 'QUESTION' : 'RÉPONSE'}
          </div>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:22, color:COLORS.ink, textAlign:'center', marginBottom: phase==='back' ? 12 : 0 }}>
            {phase === 'front' ? card.front.text : card.back.text}
          </div>
          {phase === 'back' && card.back.explanation && (
            <div style={{ fontSize:13, color:COLORS.muted, textAlign:'center', lineHeight:1.6, marginTop:8 }}>{card.back.explanation}</div>
          )}
          {phase === 'front' && <div style={{ fontSize:11, color:COLORS.muted, marginTop:16 }}>Tapez pour révéler</div>}
        </div>

        {phase === 'back' && (
          <div style={{ width:'100%', maxWidth:340 }}>
            <div style={{ fontSize:11, color:COLORS.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, textAlign:'center' }}>
              Comment l'avez-vous su ?
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {RATINGS.map(r => (
                <button key={r} onClick={() => rate(r)} style={{
                  flex:1, padding:'10px 0', borderRadius:12, border:'none', cursor:'pointer',
                  background:COLORS.rating[r-1], color:'#fff', fontFamily:'Sora,sans-serif',
                  fontWeight:700, fontSize:11, display:'flex', flexDirection:'column',
                  alignItems:'center', gap:3
                }}>
                  <span style={{ fontSize:14 }}>{r}</span>
                  <span style={{ fontSize:9 }}>{COLORS.ratingLabel[r-1]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const hudStyle = { background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' };
const backBtn = { background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 };
const btnStyle = (bg) => ({ background:bg, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' });