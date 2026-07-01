import { useTheme } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { RebusPuzzleData } from '../types/mechanics';

export default function RebusPuzzle({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: RebusPuzzleData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = { hintLevel: 1 }, puzzles = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const puzzle = puzzles[idx];
  const answered = picked !== null;
  const correct = picked === puzzle?.answer;

  const pick = useCallback((choice: string) => {
    if (answered || !puzzle) return;
    setPicked(choice);
    const isCorrect = choice === puzzle.answer;
    if (isCorrect) setScore(s => s+40);
    if (puzzle.itemId && onResponse) {
      onResponse(puzzle.itemId, isCorrect ? 5 : 1);
    }
  }, [answered, puzzle, onResponse]);

  const next = () => {
    if (idx+1 >= puzzles.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setPicked(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🧩</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Rébus résolus !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  if (!puzzle) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🧩</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Aucun rébus disponible</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Rébus 🧩</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{puzzles.length}</span>
      </div>
      <div style={{ flex:1, padding:'28px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
        {/* Rébus */}
        <div style={{ background:C.surface, borderRadius:22, padding:'28px 20px', border:`1px solid ${C.border}`, width:'100%', maxWidth:340, textAlign:'center' }}>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:16 }}>Quel mot se cache ici ?</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            {puzzle.pieces.map((p, i) => (
              <React.Fragment key={i}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:48 }}>{p.emoji}</div>
                  {config?.hintLevel >= 1 && <div style={{ fontSize:12, color:C.primary, fontWeight:700, marginTop:4 }}>({p.sound})</div>}
                </div>
                {i < puzzle.pieces.length-1 && <div style={{ fontSize:24, color:C.muted, fontWeight:800 }}>+</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop:16, fontSize:18, color:C.muted }}>= ?</div>
        </div>
        {/* Choix */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:340 }}>
          {puzzle.choices.map(c => {
            const isCorrect = answered && c===puzzle.answer;
            const isWrong = answered && c===picked && c!==puzzle.answer;
            return (
              <button key={c} onClick={() => pick(c)} style={{
                background: isCorrect?'rgba(45,122,79,.2)':isWrong?'rgba(192,57,43,.15)':C.surface,
                border:`2px solid ${isCorrect?C.success:isWrong?C.danger:C.border}`,
                borderRadius:14, padding:'14px 10px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink, cursor: answered?'default':'pointer', transition:'all .15s'
              }}>{isCorrect?'✓ ':isWrong?'✗ ':''}{c}</button>
            );
          })}
        </div>
        {answered && (
          <>
            <div style={{ background:'rgba(255,255,255,.05)', borderRadius:14, padding:'12px 16px', width:'100%', maxWidth:340, textAlign:'center', fontSize:13, color:C.muted }}>
              💡 {puzzle.explanation}
            </div>
            <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer', width:'100%', maxWidth:340 }}>
              {idx+1<puzzles.length?'Rébus suivant →':'Voir résultats'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}