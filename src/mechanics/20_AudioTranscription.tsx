import { useTheme } from '../store/useTheme';
import React, { useState, useRef, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { AudioTranscriptionData } from '../types/mechanics';

function levenshtein(a: string, b: string) {
  const m=a.length, n=b.length, dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function normalize(s: string) { return s.toLowerCase().replace(/[^a-zàâçéèêëîïôùûü ]/g,'').trim(); }

export default function AudioTranscription({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: AudioTranscriptionData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = {}, items: mappedItems = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [replays, setReplays] = useState(0);
  const [result, setResult] = useState<{ correct: boolean; partial: boolean; dist: number; pts: number; expected: string } | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const item = mappedItems[idx];
  const maxReplays = config?.maxReplays || 3;
  const tolerance = config?.tolerance || 1;
  const hint = config?.hint;

  const playAudio = () => {
    if (replays >= maxReplays || !item) return;
    if (item.audioUrl && audioRef.current) { audioRef.current.play(); }
    setReplays(r => r+1);
  };

  const validate = useCallback(() => {
    if (!item) return;
    const expected = item.normalize ? normalize(item.expected) : item.expected;
    const given = item.normalize ? normalize(input) : input;
    const dist = levenshtein(expected, given);
    const correct = dist <= tolerance;
    const partial = !correct && dist <= tolerance*3;
    const pts = correct ? item.points : partial ? Math.round(item.points*0.5) : 0;
    setScore(s => s+pts);
    setResult({ correct, partial, dist, pts, expected:item.expected });
    if (item.itemId && onResponse) {
      onResponse(item.itemId, correct ? 5 : partial ? 3 : 1);
    }
  }, [input, item, tolerance, onResponse]);

  const next = () => {
    if (idx+1 >= mappedItems.length) { setDone(true); onComplete?.(score); }
    else { setIdx(i=>i+1); setInput(''); setReplays(0); setResult(null); }
  };

  const wordCount = item?.expected?.split(' ').length || 0;

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎙️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Dictée terminée !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  if (!item) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🎙️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Aucune transcription disponible</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Dictée Audio</span>
        <span style={{ fontSize:12, color:C.muted }}>{idx+1}/{mappedItems.length}</span>
      </div>
      <div style={{ flex:1, padding:'24px 16px', display:'flex', flexDirection:'column', gap:18 }}>
        {/* Audio player */}
        <div style={{ background:C.surface, borderRadius:18, padding:20, border:`1px solid ${C.border}`, textAlign:'center' }}>
          {item.audioUrl && <audio ref={audioRef} src={item.audioUrl} />}
          <button onClick={playAudio} disabled={replays>=maxReplays} style={{
            background: replays<maxReplays?C.primary:'rgba(255,255,255,.08)', color:'#fff', border:'none', borderRadius:14, padding:'16px 32px',
            fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor: replays<maxReplays?'pointer':'default'
          }}>
            {item.audioUrl ? '▶ Écouter' : '🔇 (audio non dispo — démo)'}
          </button>
          <div style={{ marginTop:12, fontSize:11, color:C.muted }}>{maxReplays-replays} écoute{maxReplays-replays!==1?'s':''} restante{maxReplays-replays!==1?'s':''}</div>
          {hint==='word_count' && <div style={{ marginTop:8, fontSize:12, color:C.primary, fontWeight:700 }}>{wordCount} mots à transcrire</div>}
        </div>
        {/* Demo text */}
        {!item.audioUrl && (
          <div style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:12, fontSize:12, color:C.muted, textAlign:'center' }}>
            🔈 Audio de démo : <em style={{ color:C.ink }}>"{item.expected}"</em>
          </div>
        )}
        {/* Input */}
        <div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Ta transcription</div>
          <textarea value={input} onChange={e=>setInput(e.target.value)} disabled={!!result}
            placeholder="Écris ce que tu entends…"
            style={{ width:'100%', minHeight:80, background:C.surface, border:`1px solid ${result?(result.correct?C.success:C.danger):C.border}`, borderRadius:12, padding:12, color:C.ink, fontFamily:'Space Grotesk,sans-serif', fontSize:14, lineHeight:1.6, resize:'none', outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Résultat */}
        {result && (
          <div style={{ background: result.correct?'rgba(45,122,79,.15)':result.partial?'rgba(245,158,11,.1)':'rgba(192,57,43,.12)', borderRadius:14, padding:14, border:`1px solid ${result.correct?C.success:result.partial?'#f59e0b':C.danger}` }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:15, color:result.correct?C.success:result.partial?'#f59e0b':C.danger, marginBottom:6 }}>
              {result.correct?'✓ Parfait !':result.partial?'~ Presque !':'✗ Pas tout à fait'}
            </div>
            <div style={{ fontSize:12, color:C.muted }}>Bonne réponse : <em style={{ color:C.ink }}>"{result.expected}"</em></div>
            <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Écart de {result.dist} caractère{result.dist!==1?'s':''} · +{result.pts} pts</div>
          </div>
        )}
        {!result ? (
          <button onClick={validate} disabled={!input.trim()} style={{ background:input.trim()?C.primary:'rgba(255,255,255,.08)', color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:input.trim()?'pointer':'default' }}>Vérifier</button>
        ) : (
          <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
            {idx+1<mappedItems.length?'Item suivant →':'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}