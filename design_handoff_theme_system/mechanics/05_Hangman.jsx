import React, { useState, useCallback } from 'react';

const SAMPLE = {
  config: { maxErrors: 6 },
  words: [
    { id:'h1', word:'ACHALER',        hint:'Agacer, énerver quelqu'un' },
    { id:'h2', word:'MAGASINER',       hint:'Faire des achats dans les magasins' },
    { id:'h3', word:'DEBARBOUILLETTE', hint:'Petit tissu pour se laver le visage' },
    { id:'h4', word:'POUDRERIE',       hint:'Neige soulevée par le vent' },
    { id:'h5', word:'TURLUTAINE',      hint:'Idée fixe, refrain répétitif' },
  ]
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const C = { bg:'#0f1117', card:'#1a1d2e', surface:'#232640', ink:'#fff', muted:'rgba(255,255,255,.45)', border:'rgba(255,255,255,.1)', primary:'#C75B39', success:'#2D7A4F', danger:'#c0392b' };
const EMOJIS = ['😎','😬','😰','😓','😨','😱','💀'];

function shuffle(arr) { return [...arr].sort(() => Math.random()-.5); }

export default function Hangman({ data = SAMPLE, onBack, onComplete }) {
  const words = data.words;
  const maxErr = data.config?.maxErrors || 6;
  const [wordIdx, setWordIdx] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const wordObj = words[wordIdx];
  const word = wordObj.word.toUpperCase();
  const errors = guessed.filter(l => !word.includes(l)).length;
  const won = word.split('').every(l => guessed.includes(l) || l===' ');
  const lost = errors >= maxErr;
  const roundDone = won || lost;

  const guess = useCallback((letter) => {
    if (guessed.includes(letter) || roundDone) return;
    const next = [...guessed, letter];
    setGuessed(next);
  }, [guessed, roundDone]);

  const nextWord = () => {
    const pts = won ? Math.max(50 - errors*8, 10) : 0;
    const newScore = score + pts;
    setScore(newScore);
    if (wordIdx+1 >= words.length) { setDone(true); onComplete?.(newScore); }
    else { setWordIdx(i=>i+1); setGuessed([]); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Fini !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Pendu</span>
        <span style={{ fontSize:12, color:C.muted }}>{wordIdx+1}/{words.length}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:20 }}>
        {/* Erreur visual */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48 }}>{EMOJIS[Math.min(errors, 6)]}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:8 }}>
            {Array.from({length:maxErr}).map((_,i) => (
              <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: i<errors ? C.danger : 'rgba(255,255,255,.12)' }} />
            ))}
          </div>
        </div>
        {/* Indice */}
        <div style={{ background:C.card, borderRadius:14, padding:'10px 14px', border:`1px solid ${C.border}`, fontSize:12, color:C.muted, textAlign:'center' }}>
          💡 {wordObj.hint}
        </div>
        {/* Mot */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
          {word.split('').map((l, i) => (
            <div key={i} style={{
              width:l===' '?20:36, height:44, borderBottom:l===' '?'none':`2px solid ${guessed.includes(l)?C.success:C.muted}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:20,
              color: guessed.includes(l) ? C.ink : (lost ? C.danger : 'transparent')
            }}>{l}</div>
          ))}
        </div>
        {/* Résultat intermédiaire */}
        {roundDone && (
          <div style={{ background: won?'rgba(45,122,79,.2)':'rgba(192,57,43,.15)', borderRadius:14, padding:14, textAlign:'center', border:`1px solid ${won?C.success:C.danger}` }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:16, color:C.ink, marginBottom:6 }}>
              {won ? '✓ Correct !' : `✗ C'était : ${word}`}
            </div>
            <button onClick={nextWord} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>
              {wordIdx+1<words.length ? 'Mot suivant' : 'Résultats'}
            </button>
          </div>
        )}
        {/* Clavier */}
        {!roundDone && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' }}>
            {ALPHABET.map(l => {
              const used = guessed.includes(l);
              const correct = used && word.includes(l);
              const wrong = used && !word.includes(l);
              return (
                <button key={l} onClick={() => guess(l)} disabled={used} style={{
                  width:36, height:36, borderRadius:8, border:'none', cursor: used?'default':'pointer',
                  background: correct?C.success : wrong?'rgba(192,57,43,.3)' : C.surface,
                  color: used?C.muted:C.ink, fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13,
                  opacity: used?0.5:1
                }}>{l}</button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}