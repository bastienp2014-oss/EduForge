import React, { useState, useRef } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { SequencingData, SequencingItem } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

function score(items: SequencingItem[]) {
  let correct = 0;
  items.forEach((it,i) => { if(it.order === i+1) correct++; });
  return correct;
}

export default function Sequencing({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SequencingData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const { config = {} } = data || {};
  
  const mappedItems: SequencingItem[] = propItems && propItems.length > 0 ? propItems.map((item, index) => ({
    id: item.id,
    text: item.payload.answer || item.payload.question || "",
    label: item.payload.hint || "",
    order: index + 1
  })) : (data?.items && data.items.length > 0 ? data.items : [
    { id: '1', text: 'Étape 1', order: 1 },
    { id: '2', text: 'Étape 2', order: 2 },
    { id: '3', text: 'Étape 3', order: 3 }
  ]);

  const [items, setItems] = useState<SequencingItem[]>(() => shuffle([...mappedItems]));
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState<number|null>(null);
  const [done, setDone] = useState(false);
  const dragOver = useRef<number|null>(null);
  
  const correct = submitted ? score(items) : 0;
  const total = items.length;

  const onDragStart = (i: number) => setDragging(i);
  const onDragEnter = (i: number) => { dragOver.current = i; };
  const onDragEnd = () => {
    if (dragging === null || dragOver.current === null || dragging === dragOver.current) { 
      setDragging(null); 
      dragOver.current = null; 
      return; 
    }
    const arr = [...items];
    const [moved] = arr.splice(dragging, 1);
    arr.splice(dragOver.current, 0, moved);
    setItems(arr);
    setDragging(null); 
    dragOver.current = null;
  };

  const touchStart = useRef<number|null>(null);
  const touchIdx = useRef<number|null>(null);
  const onTouchStart = (e: React.TouchEvent, i: number) => { 
    touchStart.current = e.touches[0].clientY; 
    touchIdx.current = i; 
  };
  const onTouchEnd = (e: React.TouchEvent, i: number) => {
    if (touchStart.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStart.current;
    if (Math.abs(dy) < 20) return;
    const target = dy > 0 ? Math.min(i+1, items.length-1) : Math.max(i-1, 0);
    const arr = [...items];
    const [moved] = arr.splice(i, 1);
    arr.splice(target, 0, moved);
    setItems(arr);
  };

  const validate = () => {
    setSubmitted(true);
    if (onResponse) {
      items.forEach((it, i) => {
        onResponse(it.id, it.order === i + 1 ? 3 : 1);
      });
    }
  };

  const finish = () => { 
    setDone(true); 
    onComplete?.(correct*20); 
  };
  
  const isCorrect = (item: SequencingItem, i: number) => submitted && item.order === i+1;
  const isWrong = (item: SequencingItem, i: number) => submitted && item.order !== i+1;

  if (done) {
    return (
      <GameResult 
        state={correct === total ? "win" : "lose"}
        title={`${correct}/${total} dans le bon ordre`}
        points={correct * 20}
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
          Séquençage
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {total} éléments
        </span>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3 max-w-md mx-auto w-full">
        <div className="text-xs text-center mb-2" style={{ color: theme.colors.muted }}>
          Glisse pour réordonner du plus ancien au plus récent
        </div>
        
        {items.map((item, i) => (
          <div 
            key={item.id}
            draggable={!submitted}
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            onTouchStart={e => onTouchStart(e,i)}
            onTouchEnd={e => onTouchEnd(e,i)}
            className="flex items-center gap-3 p-3 select-none transition-all duration-200"
            style={{
              backgroundColor: isCorrect(item, i) ? `${theme.colors.success}20` : isWrong(item, i) ? `${theme.colors.danger}15` : theme.colors.surface,
              border: `1px solid ${isCorrect(item, i) ? theme.colors.success : isWrong(item, i) ? theme.colors.danger : border}`,
              borderRadius: radCard,
              cursor: submitted ? 'default' : 'grab',
              opacity: dragging === i ? 0.5 : 1,
              boxShadow: !submitted && dragging !== i ? shadow : 'none'
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg grid place-items-center text-sm font-extrabold shrink-0"
              style={{ backgroundColor: `${theme.colors.ink}10`, color: theme.colors.muted }}
            >
              {i + 1}
            </div>
            
            <div className="flex-1 text-[13px] leading-snug" style={{ color: theme.colors.ink }}>
              {item.text}
            </div>

            {submitted && (
              <div 
                className="text-xs font-bold shrink-0 animate-in fade-in"
                style={{ color: isCorrect(item, i) ? theme.colors.success : theme.colors.danger }}
              >
                {isCorrect(item, i) ? '✓' : `→ pos. ${item.order}`}
              </div>
            )}
            
            {config?.showLabels && (
              <div className="text-[10px] font-bold shrink-0" style={{ color: theme.colors.muted }}>
                {item.label}
              </div>
            )}
            
            {!submitted && (
              <div className="text-lg shrink-0 cursor-grab" style={{ color: `${theme.colors.ink}20` }}>
                ⠿
              </div>
            )}
          </div>
        ))}

        <div className="mt-auto pt-4 flex flex-col gap-3">
          {!submitted ? (
            <button 
              onClick={validate} 
              className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              Valider l'ordre
            </button>
          ) : (
            <>
              {submitted && config?.showLabels === false && (
                <div 
                  className="p-4 rounded-xl text-xs leading-relaxed animate-in slide-in-from-bottom-2"
                  style={{ backgroundColor: `${theme.colors.ink}05` }}
                >
                  {[...mappedItems].sort((a, b) => a.order - b.order).map(it => (
                    <div key={it.id} className="py-1" style={{ color: theme.colors.muted }}>
                      <span className="font-bold mr-2 text-current opacity-80">• {it.label}</span>
                      {it.text}
                    </div>
                  ))}
                </div>
              )}
              <button 
                onClick={finish} 
                className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] active:scale-95 transition-transform animate-in slide-in-from-bottom-2"
                style={{ 
                  backgroundColor: theme.colors.primary, 
                  color: '#fff', 
                  borderRadius: radBtn, 
                  fontFamily: theme.fonts.display 
                }}
              >
                Terminer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
