import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { SortGroupData, SortGroupItem, SortGroupGroup } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

export default function SortGroup({ data, items: propItems, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: SortGroupData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const { config = {} } = data || {};
  
  const groups: SortGroupGroup[] = data?.groups && data.groups.length > 0 ? data.groups : [
    { id: 'g1', label: 'Groupe A', emoji: '🔴', color: '#e74c3c' },
    { id: 'g2', label: 'Groupe B', emoji: '🔵', color: '#3498db' }
  ];

  const mappedItems: SortGroupItem[] = propItems && propItems.length > 0 ? propItems.map((i, index) => ({
    id: i.id,
    text: i.payload.question || i.payload.answer || "",
    groupId: groups[index % groups.length].id
  })) : (data?.items && data.items.length > 0 ? data.items : [
    { id: '1', text: 'Item 1', groupId: 'g1' },
    { id: '2', text: 'Item 2', groupId: 'g2' }
  ]);

  const [queue] = useState<SortGroupItem[]>(() => shuffle([...mappedItems]));
  const [qIdx, setQIdx] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{correct: boolean, groupLabel: string} | null>(null);
  const [done, setDone] = useState(false);

  const current = queue[qIdx];
  const total = queue.length;
  const correctCount = Object.entries(placed).filter(([id, gid]) => queue.find((i: SortGroupItem)=>i.id===id)?.groupId===gid).length;

  const placeItem = useCallback((groupId: string) => {
    if (feedback || !current) return;
    const correct = current.groupId === groupId;
    setPlaced(p => ({...p, [current.id]: groupId}));
    
    onResponse?.(current.id, correct ? 3 : 1);

    if (config?.validateMode === 'immediate') {
      const group = groups.find((g: SortGroupGroup)=>g.id===groupId);
      setFeedback({ correct, groupLabel: group?.label || '' });
      setTimeout(() => {
        setFeedback(null);
        if (qIdx+1 >= total) { setDone(true); onComplete?.((correctCount+(correct?1:0))*15); }
        else setQIdx(i=>i+1);
      }, 900);
    } else {
      if (qIdx+1 >= total) { setDone(true); onComplete?.((correctCount+(correct?1:0))*15); }
      else setQIdx(i=>i+1);
    }
  }, [feedback, current, config, groups, qIdx, total, correctCount, onComplete, onResponse]);

  if (done) {
    const finalPoints = correctCount * 15;
    return (
      <GameResult 
        state={correctCount === total ? "win" : "lose"}
        title={`${correctCount}/${total} bien classés`}
        points={finalPoints}
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
          Tri par groupes
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {qIdx + 1}/{total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full" style={{ backgroundColor: border }}>
        <div 
          className="h-full transition-all duration-300" 
          style={{ backgroundColor: theme.colors.primary, width: `${(qIdx / total) * 100}%` }} 
        />
      </div>

      <div className="flex-1 p-6 flex flex-col items-center gap-6 max-w-md mx-auto w-full">
        {/* Current Card */}
        <div 
          className="w-full text-center p-7 min-h-[120px] flex flex-col items-center justify-center gap-2 transition-colors duration-200"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `2px solid ${feedback ? (feedback.correct ? theme.colors.success : theme.colors.danger) : border}`,
            boxShadow: shadow
          }}
        >
          <div className="font-extrabold text-2xl" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {current?.text}
          </div>
          {feedback && (
            <div 
              className="text-sm font-bold animate-in fade-in" 
              style={{ color: feedback.correct ? theme.colors.success : theme.colors.danger }}
            >
              {feedback.correct ? '✓ Correct !' : '✗ Mauvais'}
            </div>
          )}
        </div>

        <div className="text-xs text-center" style={{ color: theme.colors.muted }}>
          Dans quelle catégorie va cet élément ?
        </div>

        {/* Groups */}
        <div className="flex flex-col gap-3 w-full">
          {groups.map((g: SortGroupGroup) => (
            <button 
              key={g.id} 
              onClick={() => placeItem(g.id)} 
              className="w-full flex items-center gap-3 p-4 border-2 font-bold text-[15px] cursor-pointer active:scale-95 transition-all"
              style={{
                backgroundColor: `${g.color}22`, 
                borderColor: `${g.color}88`, 
                borderRadius: radCard,
                fontFamily: theme.fonts.display, 
                color: theme.colors.ink
              }}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
