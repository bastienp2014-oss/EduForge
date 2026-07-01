import { useTheme } from '../store/useTheme';
import React, { useState, useRef, useCallback } from 'react';



import { BaseGameProps } from '../types';
import { DiagramLabelingData } from '../types/mechanics';

import { shuffle } from '../utils/array';

const DEMO_SVG = `<svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="320" fill="#1a2744"/>
  <ellipse cx="240" cy="155" rx="110" ry="28" fill="#2a4a8a" opacity="0.6"/>
  <text x="235" y="160" fill="#7db3e8" fontSize="11" textAnchor="middle">Fleuve St-Laurent</text>
  <ellipse cx="168" cy="230" rx="22" ry="14" fill="#2D7A4F" opacity="0.8"/>
  <circle cx="168" cy="230" r="5" fill="#C75B39"/>
  <text x="168" y="252" fill="#aaa" fontSize="10" textAnchor="middle">Montréal</text>
  <ellipse cx="248" cy="160" rx="18" ry="12" fill="#2D7A4F" opacity="0.7"/>
  <circle cx="248" cy="160" r="5" fill="#C75B39"/>
  <text x="248" y="182" fill="#aaa" fontSize="10" textAnchor="middle">Québec City</text>
  <ellipse cx="152" cy="88" rx="36" ry="22" fill="#1e4a2a" opacity="0.6"/>
  <text x="152" y="93" fill="#6a9" fontSize="10" textAnchor="middle">Laurentides</text>
  <text x="200" y="20" fill="rgba(255,255,255,.3)" fontSize="12" textAnchor="middle">Carte du Québec — Démo</text>
</svg>`;

type LabelItem = NonNullable<DiagramLabelingData['labels']>[number];

export default function DiagramLabeling({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: DiagramLabelingData }) {
  const { theme } = useTheme();
  const C = theme.colors;

  const { config = {}, labels = [], image } = data || {};

  const [remaining, setRemaining] = useState<LabelItem[]>(() => shuffle([...labels]));
  const [correct, setCorrect] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [selected, setSelected] = useState<LabelItem | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const tolerance = config?.tolerancePct || 6;

  const pickLabel = (label: LabelItem) => setSelected((s) => s?.id===label.id ? null : label);

  const placeOnMap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selected || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const zone = selected.zone;
    const cx = zone.x + zone.width/2;
    const cy = zone.y + zone.height/2;
    const isCorrect = Math.abs(xPct-cx) <= tolerance && Math.abs(yPct-cy) <= tolerance;
    if (isCorrect) {
      setCorrect((c)=>[...c,selected.id]);
      setScore((s)=>s+25);
      setRemaining((r)=>r.filter((l)=>l.id!==selected.id));
      if (selected.itemId && onResponse) onResponse(selected.itemId, 5);
    } else {
      setWrong((w)=>[...w,selected.id]);
      setTimeout(()=>setWrong((w)=>w.filter((id: string)=>id!==selected.id)),1000);
      if (selected.itemId && onResponse) onResponse(selected.itemId, 1);
    }
    setSelected(null);
    if (correct.length+1 >= labels.length) { setDone(true); onComplete?.(score+(isCorrect?25:0)); }
  }, [selected, correct, labels, score, tolerance, onComplete, onResponse]);

  if (done) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ fontSize:56, marginBottom:16 }}>🗺️</div>
      <div style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:C.ink, marginBottom:8 }}>{correct.length}/{labels.length} bien placés !</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:32 }}>+{score} pts</div>
      <button onClick={onBack} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:14, padding:'14px 32px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Retour</button>
    </div>
  );

  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#131629', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:16 }}>←</button>
        <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:14, color:C.ink }}>Étiquetage</span>
        <span style={{ fontSize:12, color:C.muted }}>{correct.length}/{labels.length}</span>
      </div>
      <div style={{ flex:1, padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:12, color:C.muted, textAlign:'center' }}>
          {selected ? `📍 Clique sur la carte pour placer "${selected.text}"` : 'Sélectionne une étiquette, puis clique sa position sur la carte'}
        </div>
        {/* Carte */}
        <div ref={imgRef} onClick={placeOnMap} style={{ borderRadius:16, overflow:'hidden', border:`2px solid ${selected?C.primary:C.border}`, cursor:selected?'crosshair':'default', position:'relative', width:'100%', aspectRatio:'4/3' }}>
          {image ? (
            <img src={image} style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }} alt="diagram" />
          ) : (
            <div dangerouslySetInnerHTML={{ __html:DEMO_SVG }} style={{ width:'100%', height:'100%' }} />
          )}
          {/* Markers pour étiquettes placées correctement */}
          {correct.map(id => {
            const lbl = labels.find(l=>l.id===id);
            if (!lbl) return null;
            return <div key={id} style={{ position:'absolute', left:`${lbl.zone.x+lbl.zone.width/2}%`, top:`${lbl.zone.y+lbl.zone.height/2}%`, transform:'translate(-50%,-50%)', background:C.success, color:'#fff', borderRadius:999, padding:'3px 8px', fontSize:10, fontWeight:700, whiteSpace:'nowrap', pointerEvents:'none' }}>{lbl.text}</div>;
          })}
        </div>
        {/* Étiquettes */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {remaining.map(lbl => {
            const isSel = selected?.id===lbl.id;
            const isWrong = wrong.includes(lbl.id);
            return (
              <button key={lbl.id} onClick={() => pickLabel(lbl)} style={{
                background: isWrong?'rgba(192,57,43,.2)':isSel?'rgba(199,91,57,.25)':C.surface,
                border:`2px solid ${isWrong?C.danger:isSel?C.primary:C.border}`,
                borderRadius:999, padding:'7px 14px', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:13, color:C.ink, cursor:'pointer', transition:'all .15s'
              }}>{lbl.text}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}