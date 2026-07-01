import { useTheme } from '../store/useTheme';
import React, { useState, useCallback } from 'react';
import { BaseGameProps } from '../types';
import { ErrorCorrectionData } from '../types/mechanics';

type ErrorItem = NonNullable<NonNullable<ErrorCorrectionData['exercises']>[number]['errors']>[number];

function renderText(text: string, errors: ErrorItem[], found: string[], onTap: (err: ErrorItem) => void) {
  const sorted = [...errors].sort((a,b)=>a.start-b.start);
  const parts = [];
  let last = 0;
  sorted.forEach(err => {
    if (err.start > last) parts.push(<span key={last} style={{ color:'rgba(255,255,255,.8)' }}>{text.slice(last,err.start)}</span>);
    const isFound = found.includes(err.id);
    parts.push(
      <span key={err.id} onClick={() => !isFound && onTap(err)} style={{
        background: isFound?'rgba(45,122,79,.25)':'rgba(255,220,100,.12)',
        color: isFound?'#4ade80':'#fde68a',
        borderRadius:4, padding:'1px 3px', cursor: isFound?'default':'pointer',
        textDecoration: isFound?'none':'underline dotted', fontWeight:700, fontSize:14
      }}>{isFound ? err.correct : err.wrong}</span>
    );
    last = err.end;
  });
  if (last < text.length) parts.push(<span key='end' style={{ color:'rgba(255,255,255,.8)' }}>{text.slice(last)}</span>);
  return parts;
}

export default function ErrorCorrection({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: ErrorCorrectionData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = {}, exercises = [] } = data || {};

  const [exIdx, setExIdx] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [selected, setSelected] = useState<ErrorItem | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showExpl, setShowExpl] = useState<ErrorItem | null>(null);

  const ex = exercises[exIdx];
  const allFound = ex?.errors?.every((e) => found.includes(e.id));

  const tapError = useCallback((err: ErrorItem) => {
    setSelected(err);
  }, []);

  const confirm = (err: ErrorItem) => {
    const newFound = [...found, err.id];
    setFound(newFound);
    setScore(s => s+30);
    setShowExpl(err);
    setSelected(null);
    if (ex?.itemId && onResponse) {
       // Just mark some positive progress
       onResponse(ex.itemId, 5);
    }
  };

  const next = () => {
    setShowExpl(null);
    if (exIdx+1 >= exercises.length) { setDone(true); onComplete?.(score); }
    else { setExIdx(i=>i+1); setFound([]); setSelected(null); }
  };

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔎</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Corrections terminées !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  if (!ex) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🔎</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>Aucun exercice disponible</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Correction</span>
        <span style={{ fontSize:12, color:C.muted }}>{found.length}/{ex.errors.length} erreur{ex.errors.length>1?'s':''}</span>
      </div>
      <div style={{ flex:1, padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
        {config?.showErrorCount && (
          <div style={{ background:'rgba(255,220,100,.08)', borderRadius:12, padding:'8px 14px', fontSize:12, color:'#fde68a', border:'1px solid rgba(255,220,100,.2)' }}>
            ⚠️ Ce texte contient <strong>{ex.errors.length} erreur{ex.errors.length>1?'s':''}</strong>. Tape sur les mots surlignés pour les corriger.
          </div>
        )}
        <div style={{ background:C.surface, borderRadius:16, padding:18, border:`1px solid ${C.border}`, lineHeight:1.9, fontSize:14 }}>
          {renderText(ex.text, ex.errors, found, tapError)}
        </div>
        {selected && (
          <div style={{ background:'rgba(255,255,255,.06)', borderRadius:14, padding:14, border:`1px solid ${C.primary}` }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>Corriger <strong style={{ color:C.ink }}>"{selected.wrong}"</strong> par :</div>
            <button onClick={() => confirm(selected)} style={{ background:C.success, color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer', marginRight:8 }}>✓ {selected.correct}</button>
            <button onClick={() => setSelected(null)} style={{ background:'rgba(255,255,255,.08)', color:C.muted, border:'none', borderRadius:10, padding:'10px 16px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>Annuler</button>
          </div>
        )}
        {showExpl && (
          <div style={{ background:'rgba(45,122,79,.1)', borderRadius:14, padding:14, border:`1px solid ${C.success}` }}>
            <div style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:C.success, marginBottom:4 }}>✓ Bonne correction !</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{showExpl.explanation}</div>
            <button onClick={() => setShowExpl(null)} style={{ marginTop:10, background:'rgba(255,255,255,.08)', color:C.muted, border:'none', borderRadius:8, padding:'6px 14px', fontSize:11, cursor:'pointer' }}>OK</button>
          </div>
        )}
        {allFound && !showExpl && (
          <button onClick={next} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 0', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>
            {exIdx+1<exercises.length?'Exercice suivant →':'Voir résultats'}
          </button>
        )}
      </div>
    </div>
  );
}