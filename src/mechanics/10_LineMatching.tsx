import React, { useState } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { LineMatchingData } from '../types/mechanics';
import { shuffle } from '../utils/array';
import GameResult from '../components/GameResult';

interface LineMatchingRight {
  text: string;
  pairId: string;
}

export default function LineMatching({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: LineMatchingData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const { config = {} } = data || {};
  
  const pairs = data?.pairs && data.pairs.length > 0 ? data.pairs : (propItems && propItems.length > 0 ? propItems.map((i, index) => ({
    id: i.id,
    left: { text: i.payload.question || `Q${index+1}` },
    right: { text: i.payload.answer || `A${index+1}` }
  })) : [
    { id: 'p1', left: { text: 'Pomme' }, right: { text: 'Fruit rouge' } },
    { id: 'p2', left: { text: 'Banane' }, right: { text: 'Fruit jaune' } }
  ]);
  
  const [rights] = useState<LineMatchingRight[]>(() => 
    config?.shuffleRight !== false 
      ? shuffle(pairs.map((p)=>({ ...p.right, pairId: p.id }))) 
      : pairs.map((p)=>({ ...p.right, pairId: p.id }))
  );
  
  const [selected, setSelected] = useState<string|null>(null);
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);

  const correct = Object.entries(connections).filter(([l,r]) => l===r).length;
  const total = pairs.length;

  const pickLeft = (pairId: string) => {
    if (submitted) return;
    setSelected(s => s===pairId ? null : pairId);
  };

  const pickRight = (pairId: string) => {
    if (submitted || !selected) return;
    setConnections(c => {
      const next = {...c};
      Object.keys(next).forEach(k => { if(next[k]===pairId) delete next[k]; });
      next[selected] = pairId;
      return next;
    });
    setSelected(null);
  };

  const validate = () => {
    setSubmitted(true);
    if (onResponse) {
      pairs.forEach((p) => {
        onResponse(p.id, connections[p.id] === p.id ? 3 : 1);
      });
    }
  };

  const finish = () => { setDone(true); onComplete?.(correct*20); };

  if (done) {
    const finalPoints = correct * 20;
    return (
      <GameResult 
        state={correct === total ? "win" : "lose"}
        title={`${correct}/${total} bonnes associations`}
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
          Associations
        </span>
        <span className="text-xs" style={{ color: theme.colors.muted }}>
          {Object.keys(connections).length}/{total}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <div className="text-xs text-center" style={{ color: theme.colors.muted }}>
          Sélectionne un mot à gauche, puis sa définition à droite
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* Left Column */}
          <div className="flex flex-col gap-2">
            {pairs.map((p) => {
              const isSelected = selected === p.id;
              const isConnected = !!connections[p.id];
              const isCorrect = submitted && connections[p.id] === p.id;
              const isWrong = submitted && connections[p.id] && connections[p.id] !== p.id;
              
              return (
                <button 
                  key={p.id} 
                  onClick={() => pickLeft(p.id)} 
                  className="p-3 text-left border-2 font-bold text-[13px] transition-all cursor-pointer select-none active:scale-[0.98]"
                  style={{
                    backgroundColor: isCorrect ? `${theme.colors.success}33` : isWrong ? `${theme.colors.danger}26` : isSelected ? `${theme.colors.primary}33` : isConnected ? `${theme.colors.ink}14` : theme.colors.surface,
                    borderColor: isCorrect ? theme.colors.success : isWrong ? theme.colors.danger : isSelected ? theme.colors.primary : isConnected ? `${theme.colors.primary}80` : border,
                    borderRadius: radCard, 
                    fontFamily: theme.fonts.display, 
                    color: theme.colors.ink,
                    boxShadow: isSelected ? `0 0 0 2px ${theme.colors.primary}33` : !submitted ? shadow : 'none'
                  }}
                >
                  {p.left.text}
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2">
            {rights.map((r) => {
              const isLinked = Object.values(connections).includes(r.pairId);
              const leftKey = Object.keys(connections).find(k=>connections[k]===r.pairId);
              const isCorrect = submitted && leftKey===r.pairId;
              const isWrong = submitted && isLinked && leftKey!==r.pairId;
              const isTargetable = selected && !isLinked;
              
              return (
                <button 
                  key={r.pairId} 
                  onClick={() => pickRight(r.pairId)} 
                  className="p-3 text-left border-2 font-semibold text-xs transition-all cursor-pointer select-none active:scale-[0.98]"
                  style={{
                    backgroundColor: isCorrect ? `${theme.colors.success}33` : isWrong ? `${theme.colors.danger}26` : isLinked ? `${theme.colors.ink}14` : isTargetable ? `${theme.colors.primary}10` : theme.colors.surface,
                    borderColor: isCorrect ? theme.colors.success : isWrong ? theme.colors.danger : isLinked ? `${theme.colors.primary}80` : isTargetable ? `${theme.colors.primary}40` : border,
                    borderRadius: radCard, 
                    fontFamily: theme.fonts.display, 
                    color: theme.colors.ink,
                    boxShadow: !submitted ? shadow : 'none'
                  }}
                >
                  {r.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-2 pb-4 flex flex-col gap-3">
          {!submitted ? (
            <button 
              onClick={validate} 
              disabled={Object.keys(connections).length < total} 
              className="w-full py-3.5 border-none font-bold text-[15px] transition-transform disabled:opacity-50"
              style={{ 
                backgroundColor: Object.keys(connections).length >= total ? theme.colors.primary : `${theme.colors.ink}14`, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display, 
                cursor: Object.keys(connections).length >= total ? 'pointer' : 'default',
                transform: Object.keys(connections).length >= total ? 'scale(1)' : 'scale(0.98)'
              }}
            >
              Valider
            </button>
          ) : (
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
              Terminer → +{correct * 20} pts
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
