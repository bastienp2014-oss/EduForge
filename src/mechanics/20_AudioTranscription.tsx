import React, { useState, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { AudioTranscriptionData } from '../types/mechanics';
import GameResult from '../components/GameResult';

function levenshtein(a: string, b: string) {
  const m=a.length, n=b.length, dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i||j));
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function normalize(s: string) { return s.toLowerCase().replace(/[^a-zàâçéèêëîïôùûü ]/g,'').trim(); }

export default function AudioTranscription({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: AudioTranscriptionData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();

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

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Dictée terminée !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!item) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">🎙️</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucune transcription disponible
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
          Dictée Audio
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {idx+1}/{mappedItems.length}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* Audio player */}
        <div 
          className="p-6 text-center border"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            boxShadow: shadow
          }}
        >
          {item.audioUrl && <audio ref={audioRef} src={item.audioUrl} />}
          <button 
            onClick={playAudio} 
            disabled={replays >= maxReplays} 
            className={`px-8 py-4 border-none font-bold text-[15px] transition-transform ${replays < maxReplays ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
            style={{
              backgroundColor: replays < maxReplays ? theme.colors.primary : `${theme.colors.ink}14`, 
              color: replays < maxReplays ? '#fff' : theme.colors.muted, 
              borderRadius: radBtn, 
              fontFamily: theme.fonts.display, 
            }}
          >
            {item.audioUrl ? '▶ Écouter' : '🔇 (audio non dispo — démo)'}
          </button>
          <div className="mt-3 text-[11px] font-bold" style={{ color: theme.colors.muted }}>
            {maxReplays-replays} écoute{maxReplays-replays!==1?'s':''} restante{maxReplays-replays!==1?'s':''}
          </div>
          {hint === 'word_count' && (
            <div className="mt-2 text-xs font-bold" style={{ color: theme.colors.primary }}>
              {wordCount} mots à transcrire
            </div>
          )}
        </div>

        {/* Demo text */}
        {!item.audioUrl && (
          <div 
            className="p-3 text-xs text-center border"
            style={{ 
              backgroundColor: `${theme.colors.ink}0a`, 
              borderRadius: radCard, 
              borderColor: border,
              color: theme.colors.muted 
            }}
          >
            🔈 Audio de démo : <em className="font-medium" style={{ color: theme.colors.ink }}>"{item.expected}"</em>
          </div>
        )}

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.colors.muted }}>
            Ta transcription
          </div>
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            disabled={!!result}
            placeholder="Écris ce que tu entends…"
            className="w-full min-h-[100px] p-4 text-sm leading-relaxed resize-none outline-none border transition-colors"
            style={{ 
              backgroundColor: theme.colors.surface, 
              borderColor: result ? (result.correct ? theme.colors.success : theme.colors.danger) : border, 
              borderRadius: radCard, 
              color: theme.colors.ink, 
            }} 
          />
        </div>

        {/* Résultat */}
        {result && (
          <div 
            className="p-4 border animate-in slide-in-from-bottom-2"
            style={{ 
              backgroundColor: result.correct ? `${theme.colors.success}26` : result.partial ? '#f59e0b1a' : `${theme.colors.danger}1f`, 
              borderRadius: radCard, 
              borderColor: result.correct ? theme.colors.success : result.partial ? '#f59e0b' : theme.colors.danger 
            }}
          >
            <div className="font-extrabold text-[15px] mb-1.5" style={{ fontFamily: theme.fonts.display, color: result.correct ? theme.colors.success : result.partial ? '#f59e0b' : theme.colors.danger }}>
              {result.correct ? '✓ Parfait !' : result.partial ? '~ Presque !' : '✗ Pas tout à fait'}
            </div>
            <div className="text-xs" style={{ color: theme.colors.muted }}>
              Bonne réponse : <em className="font-medium" style={{ color: theme.colors.ink }}>"{result.expected}"</em>
            </div>
            <div className="text-xs font-bold mt-2 opacity-80" style={{ color: theme.colors.muted }}>
              Écart de {result.dist} caractère{result.dist!==1?'s':''} · +{result.pts} pts
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          {!result ? (
            <button 
              onClick={validate} 
              disabled={!input.trim()} 
              className="w-full py-3.5 border-none font-bold text-[15px] transition-transform active:scale-95"
              style={{ 
                backgroundColor: input.trim() ? theme.colors.primary : `${theme.colors.ink}14`, 
                color: input.trim() ? '#fff' : theme.colors.muted, 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display, 
                cursor: input.trim() ? 'pointer' : 'default' 
              }}
            >
              Vérifier
            </button>
          ) : (
            <button 
              onClick={next} 
              className="w-full py-3.5 border-none cursor-pointer font-bold text-[15px] transition-transform active:scale-95 animate-in slide-in-from-bottom-2"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {idx+1<mappedItems.length ? 'Item suivant →' : 'Voir résultats'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}