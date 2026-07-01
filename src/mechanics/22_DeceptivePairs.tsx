import { useTheme } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { DeceptivePairsData } from '../types/mechanics';

export default function DeceptivePairs({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: DeceptivePairsData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = {}, pairs = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  type PairItem = NonNullable<DeceptivePairsData['pairs']>[number];
  type ChoiceItem = NonNullable<PairItem['choices']>[number];

  const pair = pairs[idx];
  const answered = picked !== null;
  const pickedChoice = pair?.choices?.find((c) => c.id===picked);

  const pick = useCallback((choice: ChoiceItem) => {
    if (answered || !pair) return;
    setPicked(choice.id);
    if (choice.correct) setScore(s=>s+35);
    if (pair.itemId && onResponse) {
       onResponse(pair.itemId, choice.correct ? 5 : 1);
    }
  }, [answered, pair, onResponse]);

  const next = () => {
    if (idx+1 >= pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🤥</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Faux amis démasqués !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  if (!pair) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🤥</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Aucune paire disponible</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Faux Amis</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{pairs.length}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {/* Mot + contexte A */}
        <div style={{ background:C.surface, borderRadius:18, padding:20, border:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:26, color:C.ink, marginBottom:10 }}>{pair.term}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ background:'rgba(43,90,160,.25)', borderRadius:999, padding:'3px 10px', fontSize:10, fontWeight:700, color:'#93c5fd' }}>{config?.contextA}</div>
          </div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6, fontStyle:'italic' }}>"{pair.meaningA}"</div>
        </div>
        {/* Question */}
        <div style={{ fontSize:13, color:C.primary, fontWeight:700, textAlign:'center' }}>
          Que signifie <strong>"{pair.term}"</strong> en <span style={{ background:'rgba(199,91,57,.2)', borderRadius:4, padding:'1px 6px' }}>{config?.contextB}</span> ?
        </div>
        {/* Choix */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {pair.choices.map((c) => {
            const isCorrect = answered && c.correct;
            const isWrong = answered && c.id===picked && !c.correct;
            return (
              <button key={c.id} onClick={() => pick(c)} style={{
                background: isCorrect?'rgba(45,122,79,.2)':isWrong?'rgba(192,57,43,.15)':C.surface,
                border:`2px solid ${isCorrect?C.success:isWrong?C.danger:C.border}`,
                borderRadius:14, padding:'14px 16px', textAlign:'left',
                fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, color:C.ink, cursor:answered?'default':'pointer', transition:'all .15s', display:'flex', alignItems:'center', gap:10
              }}>
                {c.isMeaningA && <span style={{ fontSize:10, background:'rgba(99,102,241,.2)', color:'#a5b4fc', borderRadius:4, padding:'2px 6px', fontWeight:700, flexShrink:0 }}>⚠️ Piège</span>}
                <span>{isCorrect?'✓ ':isWrong?'✗ ':''}{c.text}</span>
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <div style={{ background:'rgba(255,255,255,.04)', borderRadius:14, padding:14, border:`1px solid rgba(255,255,255,.08)` }}>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:6 }}>💡 {pair.explanation}</div>
              {pair.etymology && <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontStyle:'italic' }}>📜 {pair.etymology}</div>}
            </div>
            <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
              {idx+1<pairs.length?'Paire suivante →':'Voir résultats'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}