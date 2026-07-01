import { useTheme } from '../store/useTheme';
import React, { useState, useRef, useCallback } from 'react';



import { BaseGameProps } from '../types';
import { AudioABData } from '../types/mechanics';

export default function AudioAB({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: AudioABData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = {}, pairs = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const [playing, setPlaying] = useState<'A' | 'B' | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const audioA = useRef<HTMLAudioElement>(null);
  const audioB = useRef<HTMLAudioElement>(null);

  const pair = pairs[idx];
  const answered = picked !== null;

  const playClip = (which: 'A' | 'B') => {
    if (!pair) return;
    setPlaying(which);
    const ref = which==='A' ? audioA : audioB;
    const audioUrl = which==='A' ? pair.audioA : pair.audioB;
    if (ref.current && audioUrl) {
      ref.current.play();
      ref.current.onended = () => setPlaying(null);
    } else {
      setTimeout(() => setPlaying(null), 1500);
    }
  };

  const pick = (which: 'A' | 'B') => {
    if (answered || !pair) return;
    setPicked(which);
    const correct = which === pair.correct;
    if (correct) setScore((s)=>s+30);
    if (pair.itemId && onResponse) {
      onResponse(pair.itemId, correct ? 5 : 1);
    }
  };

  const next = () => {
    if (idx+1 >= pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx((i)=>i+1); setPicked(null); setPlaying(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>👂</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Oreille exercée !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  if (!pair) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>👂</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Aucune paire disponible</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  const isCorrect = (w: 'A' | 'B') => answered && w===pair.correct;
  const isWrong   = (w: 'A' | 'B') => answered && picked===w && w!==pair.correct;

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Comparaison A/B</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{pairs.length}</span>
      </div>
      {pair.audioA && <audio ref={audioA} src={pair.audioA} />}
      {pair.audioB && <audio ref={audioB} src={pair.audioB} />}
      <div style={{ flex:1, padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        {/* Critère */}
        <div style={{ background:C.surface, borderRadius:16, padding:'14px 18px', border:`1px solid ${C.border}`, textAlign:'center', width:'100%', maxWidth:340 }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Critère</div>
          <div style={{ fontSize:13, color:C.ink, fontWeight:600 }}>{config?.criterion}</div>
        </div>
        {/* Label */}
        <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink }}>{pair.label}</div>
        {/* Clips A et B */}
        <div style={{ display:'flex', gap:16, width:'100%', maxWidth:340 }}>
          {(['A','B'] as const).map(w => (
            <div key={w} style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={() => playClip(w)} style={{
                background:playing===w?'rgba(199,91,57,.2)':C.surface, border:`2px solid ${playing===w?C.primary:C.border}`,
                borderRadius:14, padding:'20px 10px', fontSize:24, cursor:'pointer', textAlign:'center'
              }}>{playing===w?'⏸':'▶'}</button>
              <button onClick={() => pick(w)} disabled={answered} style={{
                background: isCorrect(w)?'rgba(45,122,79,.2)':isWrong(w)?'rgba(192,57,43,.15)':C.surface,
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
              {idx+1<pairs.length?'Paire suivante →':'Voir résultats'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}