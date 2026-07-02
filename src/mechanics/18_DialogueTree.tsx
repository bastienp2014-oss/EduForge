import { useTheme, useThemeTokens } from '../store/useTheme';
import React, { useState } from 'react';
import { BaseGameProps } from '../types';
import { DialogueTreeData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function DialogueTree({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: DialogueTreeData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

  const { config = { character: { name: 'PNJ', avatar: '🤖' } }, startNode = 'n1', nodes = {} } = data || {};

  const char = config?.character || { name:'PNJ', avatar:'🤖' };
  const [nodeId, setNodeId] = useState(startNode);
  const [score, setScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{text: string; good: boolean} | null>(null);
  const [history, setHistory] = useState<{npc: string; player?: string}[]>([]);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'neutral' | 'lose' | null>(null);

  const node = nodes[nodeId];

  const pick = (choice: any) => {
    const newScore = score + (choice.points||0);
    setScore(newScore);
    setLastFeedback({ text: choice.feedback, good: (choice.points||0) > 0 });
    setHistory(h => [...h, { npc: node.npc, player: choice.text }]);
    setTimeout(() => {
      setLastFeedback(null);
      const nextNode = nodes[choice.next];
      if (nextNode?.isEnd) {
        setOutcome(nextNode.outcome);
        setHistory(h => [...h, { npc: nextNode.npc }]);
        setDone(true);
        if (items?.[0] && onResponse) {
           onResponse(items[0].id, (choice.points || 0) > 0 ? 5 : 1);
        }
        onComplete?.(newScore);
      } else {
        setNodeId(choice.next);
      }
    }, 1600);
  };

  if (done) {
    return (
      <GameResult 
        state={outcome === 'win' || outcome === 'neutral' ? 'win' : 'lose'}
        title="Dialogue terminé"
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
        <div className="flex items-center gap-2">
          <span className="text-xl">{char.avatar}</span>
          <span className="font-bold text-sm" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {char.name}
          </span>
        </div>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          ⭐ {score}
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Historique compact */}
        {history.slice(-2).map((h,i) => (
          <React.Fragment key={i}>
            <div className="flex gap-2.5 items-start">
              <span className="text-xl shrink-0 opacity-70">{char.avatar}</span>
              <div 
                className="p-3 text-xs leading-relaxed max-w-[85%]"
                style={{ 
                  backgroundColor: theme.colors.surface, 
                  borderRadius: radCard, 
                  borderTopLeftRadius: 4, 
                  color: theme.colors.muted 
                }}
              >
                {h.npc}
              </div>
            </div>
            {h.player && (
              <div className="flex justify-end">
                <div 
                  className="p-3 text-xs max-w-[85%]"
                  style={{ 
                    backgroundColor: `${theme.colors.primary}26`, 
                    borderRadius: radCard, 
                    borderTopRightRadius: 4, 
                    color: theme.colors.muted 
                  }}
                >
                  {h.player}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Message actuel */}
        <div className="flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2">
          <span className="text-2xl shrink-0">{char.avatar}</span>
          <div 
            className="flex-1 p-4 text-sm leading-relaxed border"
            style={{ 
              backgroundColor: theme.colors.surface, 
              borderRadius: radCard, 
              borderTopLeftRadius: 4, 
              color: theme.colors.ink, 
              borderColor: border,
              boxShadow: shadow
            }}
          >
            {node.npc}
          </div>
        </div>

        {lastFeedback && (
          <div 
            className="p-3 text-xs border animate-in zoom-in-95"
            style={{ 
              backgroundColor: lastFeedback.good ? `${theme.colors.success}26` : `${theme.colors.danger}1f`, 
              borderRadius: radCard, 
              color: lastFeedback.good ? theme.colors.success : theme.colors.danger, 
              borderColor: lastFeedback.good ? theme.colors.success : theme.colors.danger 
            }}
          >
            💬 {lastFeedback.text}
          </div>
        )}

        {/* Choix */}
        {!lastFeedback && (
          <div className="flex flex-col gap-2 mt-2">
            {node.choices?.map((c: any, i: number) => (
              <button 
                key={i} 
                onClick={() => pick(c)} 
                className="p-4 text-left border font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform animate-in slide-in-from-bottom-3"
                style={{ 
                  backgroundColor: theme.colors.surface, 
                  borderColor: border, 
                  borderRadius: radBtn, 
                  fontFamily: theme.fonts.display, 
                  color: theme.colors.ink 
                }}
              >
                {c.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}