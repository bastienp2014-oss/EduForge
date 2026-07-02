import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { DiagramLabelingData } from '../types/mechanics';
import GameResult from '../components/GameResult';
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
  const { border, radCard, shadow } = useThemeTokens();

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

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Carte complétée !"
        subtitle={`${correct.length}/${labels.length} bien placés`}
        points={score}
        onBack={onBack}
      />
    );
  }

  return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col`} style={{ backgroundColor: theme.colors.bg }}>
      {/* HUD */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ 
          backgroundColor: theme.colors.header, 
          borderColor: border 
        }}
      >
        <button 
          onClick={onBack} 
          className="rounded-lg px-3 py-1.5 text-base cursor-pointer"
          style={{ backgroundColor: border, color: theme.colors.ink }}
        >
          ←
        </button>
        <span className="font-bold text-sm" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
          Étiquetage
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {correct.length}/{labels.length}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        <div className="text-xs text-center font-semibold" style={{ color: theme.colors.muted }}>
          {selected 
            ? `📍 Clique sur la carte pour placer "${selected.text}"` 
            : 'Sélectionne une étiquette, puis clique sa position sur la carte'
          }
        </div>

        {/* Carte */}
        <div 
          ref={imgRef} 
          onClick={placeOnMap} 
          className={`w-full aspect-[4/3] relative overflow-hidden transition-all ${selected ? 'cursor-crosshair scale-[1.01]' : 'cursor-default'}`}
          style={{ 
            borderRadius: radCard, 
            border: `2px solid ${selected ? theme.colors.primary : border}`, 
            boxShadow: shadow
          }}
        >
          {image ? (
            <img src={image} className="w-full h-full object-contain block" alt="diagram" />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: DEMO_SVG }} className="w-full h-full" />
          )}

          {/* Markers pour étiquettes placées correctement */}
          {correct.map(id => {
            const lbl = labels.find(l=>l.id===id);
            if (!lbl) return null;
            return (
              <div 
                key={id} 
                className="absolute px-2 py-1 text-[10px] font-bold whitespace-nowrap pointer-events-none rounded-full"
                style={{ 
                  left: `${lbl.zone.x+lbl.zone.width/2}%`, 
                  top: `${lbl.zone.y+lbl.zone.height/2}%`, 
                  transform: 'translate(-50%,-50%)', 
                  backgroundColor: theme.colors.success, 
                  color: '#fff',
                  fontFamily: theme.fonts.display
                }}
              >
                {lbl.text}
              </div>
            );
          })}
        </div>

        {/* Étiquettes */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {remaining.map(lbl => {
            const isSel = selected?.id === lbl.id;
            const isWrong = wrong.includes(lbl.id);
            return (
              <button 
                key={lbl.id} 
                onClick={() => pickLabel(lbl)} 
                className="px-3.5 py-2 rounded-full border-2 font-bold text-[13px] cursor-pointer transition-all active:scale-95"
                style={{
                  backgroundColor: isWrong ? `${theme.colors.danger}33` : isSel ? `${theme.colors.primary}40` : theme.colors.surface,
                  borderColor: isWrong ? theme.colors.danger : isSel ? theme.colors.primary : border,
                  color: theme.colors.ink,
                  fontFamily: theme.fonts.display
                }}
              >
                {lbl.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}