import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { AudioABData } from '../types/mechanics';
import GameResult from '../components/GameResult';

export default function AudioAB({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: AudioABData }) {
  const { theme } = useTheme();
  const tokens = useThemeTokens();
  const { border, radCard, radBtn, shadow } = tokens;
  const C = theme.colors;

  const { config = {}, pairs = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<'A' | 'B' | null>(null);
  const [playing, setPlaying] = useState<'A' | 'B' | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const audioA = useRef<HTMLAudioElement>(null);
  const audioB = useRef<HTMLAudioElement>(null);

  const pair = pairs[idx];
  const answered = picked !== null;

  const playClip = (which: 'A' | 'B') => {
    if (!pair) return;
    setPlaying(which);
    const ref = which==='A' ? audioA : audioB;
    const audioUrl = which==='A' ? pair.audioA : pair.audioB;
    if (ref.current && audioUrl) {
      ref.current.play();
      ref.current.onended = () => setPlaying(null);
    } else {
      setTimeout(() => setPlaying(null), 1500);
    }
  };

  const pick = (which: 'A' | 'B') => {
    if (answered || !pair) return;
    setPicked(which);
    const correct = which === pair.correct;
    if (correct) setScore((s)=>s+30);
    if (pair.itemId && onResponse) {
      onResponse(pair.itemId, correct ? 5 : 1);
    }
  };

  const next = () => {
    if (idx+1 >= pairs.length) { setDone(true); onComplete?.(score); }
    else { setIdx((i)=>i+1); setPicked(null); setPlaying(null); }
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Oreille exercée !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!pair) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">👂</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucune paire disponible
      </div>
      <button 
        onClick={onBack} 
        className="mt-6 px-8 py-3 rounded-xl border-none font-bold text-sm cursor-pointer"
        style={{ backgroundColor: theme.colors.primary, color: '#fff', fontFamily: theme.fonts.display }}
      >
        Retour
      </button>
    </div>
  );

  const isCorrect = (w: 'A' | 'B') => answered && w===pair.correct;
  const isWrong   = (w: 'A' | 'B') => answered && picked===w && w!==pair.correct;

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
          Comparaison A/B
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {idx+1}/{pairs.length}
        </span>
      </div>

      {pair.audioA && <audio ref={audioA} src={pair.audioA} />}
      {pair.audioB && <audio ref={audioB} src={pair.audioB} />}

      <div className="flex-1 p-6 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
        {/* Critère */}
        <div 
          className="p-4 border text-center w-full"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: theme.colors.muted }}>
            Critère
          </div>
          <div className="text-[13px] font-semibold" style={{ color: theme.colors.ink }}>
            {config?.criterion}
          </div>
        </div>

        {/* Label */}
        <div className="font-extrabold text-2xl text-center" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
          {pair.label}
        </div>

        {/* Clips A et B */}
        <div className="flex gap-4 w-full">
          {(['A','B'] as const).map(w => (
            <div key={w} className="flex-1 flex flex-col gap-2.5">
              <button 
                onClick={() => playClip(w)} 
                className="p-5 border-2 text-2xl text-center rounded-xl cursor-pointer transition-transform active:scale-95"
                style={{
                  backgroundColor: playing===w ? `${theme.colors.primary}33` : theme.colors.surface, 
                  borderColor: playing===w ? theme.colors.primary : border,
                  boxShadow: playing===w ? `0 0 15px ${theme.colors.primary}40` : 'none'
                }}
              >
                {playing===w ? '⏸' : '▶'}
              </button>
              <button 
                onClick={() => pick(w)} 
                disabled={answered} 
                className="p-2.5 border-2 text-[15px] font-bold text-center cursor-pointer transition-all active:scale-95"
                style={{
                  backgroundColor: isCorrect(w) ? `${theme.colors.success}33` : isWrong(w) ? `${theme.colors.danger}26` : theme.colors.surface,
                  borderColor: isCorrect(w) ? theme.colors.success : isWrong(w) ? theme.colors.danger : border,
                  borderRadius: radBtn, 
                  fontFamily: theme.fonts.display, 
                  color: theme.colors.ink, 
                  opacity: answered && picked !== w && !isCorrect(w) ? 0.6 : 1
                }}
              >
                Version {w}
              </button>
            </div>
          ))}
        </div>

        {answered && (
          <div className="flex flex-col gap-4 w-full mt-2 animate-in slide-in-from-bottom-2">
            <div 
              className="p-4 border text-center"
              style={{ 
                backgroundColor: `${theme.colors.ink}0a`, 
                borderRadius: radCard, 
                borderColor: border 
              }}
            >
              <div className="font-bold text-sm mb-1.5" style={{ fontFamily: theme.fonts.display, color: picked===pair.correct ? theme.colors.success : theme.colors.danger }}>
                {picked===pair.correct ? '✓ Bonne oreille !' : '✗ Version '+pair.correct+' était la bonne'}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: theme.colors.muted }}>
                {pair.explanation}
              </div>
            </div>
            <button 
              onClick={next} 
              className="w-full py-3.5 border-none font-bold text-[15px] cursor-pointer transition-transform active:scale-95"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {idx+1<pairs.length ? 'Paire suivante →' : 'Voir résultats'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}