import React, { useState, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { CombinationBuilderData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function CombinationBuilder({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: CombinationBuilderData }) {
  const { theme } = useTheme();
  const { border, radCard, shadow } = useThemeTokens();

  const { config = {}, reels = [], validCombinations = [] } = data || {};

  const [positions, setPositions] = useState(reels.map(() => 0));
  const [held, setHeld] = useState(reels.map(() => false));
  const [spinning, setSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(config?.maxSpins || 3);
  const [result, setResult] = useState<{ win: boolean; result?: string; definition?: string; points?: number } | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const currentCombo = positions.map((p,i) => reels[i].items[p]);

  const checkCombo = useCallback((pos: number[]) => {
    const combo = pos.map((p,i) => reels[i].items[p]);
    return validCombinations.find((v) => v.combo.every((c, i: number) => c===combo[i]));
  }, [reels, validCombinations]);

  const spin = useCallback(() => {
    if (spinning || spinsLeft <= 0) return;
    setSpinning(true);
    setResult(null);
    let iters = 0;
    const iv = setInterval(() => {
      setPositions(pos => pos.map((p,i) => held[i] ? p : Math.floor(Math.random()*reels[i].items.length)));
      if (++iters > 12) {
        clearInterval(iv);
        setSpinning(false);
        const newSpins = spinsLeft-1;
        setSpinsLeft(newSpins);
        setPositions(pos => {
          const match = checkCombo(pos);
          if (match) {
            setResult({ win:true, ...match });
            setScore(s=>s+(match.points || 0));
            // Simulate response logic for integration
            if (onResponse) onResponse(`combo_${match.result}`, 3);
            onComplete?.(score+(match.points || 0));
          }
          else if (newSpins<=0) {
             setResult({ win:false });
          }
          return pos;
        });
      }
    }, 80);
  }, [spinning, spinsLeft, held, reels, checkCombo, score, onComplete, onResponse]);

  const toggleHold = (i: number) => {
    if (spinning || spinsLeft<=0 || result?.win) return;
    setHeld(h => h.map((v,idx) => idx===i?!v:v));
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Terminé !"
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
          Loto-Vocab 🎰
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {spinsLeft} tours · {score} pts
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center gap-7 justify-center max-w-md mx-auto w-full">
        {/* Reels */}
        <div className="flex gap-3 justify-center">
          {reels.map((reel, i) => (
            <div 
              key={reel.id} 
              onClick={() => toggleHold(i)} 
              className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            >
              <div 
                className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center font-extrabold text-lg transition-colors"
                style={{ 
                  backgroundColor: spinning && !held[i] ? theme.colors.surface : theme.colors.surface, 
                  borderColor: held[i] ? theme.colors.success : border, 
                  color: theme.colors.ink,
                  fontFamily: theme.fonts.display,
                  boxShadow: shadow
                }}
              >
                {reel.items[positions[i]] || '—'}
              </div>
              <div 
                className="text-[10px] font-bold uppercase tracking-wider" 
                style={{ color: held[i] ? theme.colors.success : theme.colors.muted }}
              >
                {held[i] ? '🔒 Tenu' : 'Tap tenir'}
              </div>
            </div>
          ))}
        </div>

        {/* Résultat */}
        {result && (
          <div 
            className="w-full text-center p-4 border-2 animate-in zoom-in-95"
            style={{ 
              backgroundColor: result.win ? `${theme.colors.success}26` : `${theme.colors.danger}1f`, 
              borderRadius: radCard, 
              borderColor: result.win ? theme.colors.success : theme.colors.danger 
            }}
          >
            {result.win ? (
              <>
                <div className="font-extrabold text-xl mb-1" style={{ fontFamily: theme.fonts.display, color: theme.colors.success }}>
                  🎉 {result.result} !
                </div>
                <div className="text-[13px] mb-2" style={{ color: theme.colors.muted }}>
                  {result.definition}
                </div>
                <div className="font-extrabold text-base mb-3" style={{ fontFamily: theme.fonts.display, color: '#F5C542' }}>
                  +{result.points} pts
                </div>
                <button 
                  onClick={() => setDone(true)} 
                  className="px-6 py-2.5 rounded-xl border-none font-bold text-sm cursor-pointer"
                  style={{ backgroundColor: theme.colors.primary, color: '#fff', fontFamily: theme.fonts.display }}
                >
                  Terminer
                </button>
              </>
            ) : (
              <>
                <div className="font-extrabold text-base mb-3" style={{ fontFamily: theme.fonts.display, color: theme.colors.danger }}>
                  Aucune combinaison valide
                </div>
                <button 
                  onClick={() => setDone(true)} 
                  className="px-6 py-2.5 rounded-xl border-none font-bold text-sm cursor-pointer"
                  style={{ backgroundColor: theme.colors.primary, color: '#fff', fontFamily: theme.fonts.display }}
                >
                  Terminer
                </button>
              </>
            )}
          </div>
        )}

        {/* Spin button */}
        {!result && (
          <button 
            onClick={spin} 
            disabled={spinning || spinsLeft <= 0} 
            className="rounded-full px-12 py-4 border-none font-extrabold text-lg transition-transform active:scale-95"
            style={{
              backgroundColor: spinsLeft > 0 ? theme.colors.primary : `${theme.colors.ink}14`, 
              color: spinsLeft > 0 ? '#fff' : theme.colors.muted,
              fontFamily: theme.fonts.display,
              cursor: spinsLeft > 0 ? 'pointer' : 'default',
              boxShadow: spinsLeft > 0 ? `0 4px 20px ${theme.colors.primary}66` : 'none'
            }}
          >
            {spinning ? '🎰 …' : `Tourner (${spinsLeft} restants)`}
          </button>
        )}

        {/* Combinaisons valides */}
        <div className="w-full mt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.colors.muted }}>
            Combinaisons possibles
          </div>
          <div className="flex flex-wrap gap-2">
            {validCombinations.map((v) => (
              <div 
                key={v.result} 
                className="rounded-full px-3 py-1 text-[11px] font-bold border"
                style={{ 
                  backgroundColor: theme.colors.surface, 
                  borderColor: border,
                  color: theme.colors.muted 
                }}
              >
                {v.result}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}