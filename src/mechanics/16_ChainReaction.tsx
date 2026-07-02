import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme, useThemeTokens } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { ChainReactionData } from '../types/mechanics';
import GameResult from '../components/GameResult';

type ChainReactionWord = NonNullable<ChainReactionData['wordBank']>[number];

export default function ChainReaction({ items: propItems, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: ChainReactionData }) {
  const { theme } = useTheme();
  const { border, radCard, radBtn, shadow } = useThemeTokens();
  const { config = {} } = data || {};
  
  const wordBank: ChainReactionWord[] = data?.wordBank && data.wordBank.length > 0 ? data.wordBank : (propItems && propItems.length > 0 ? propItems.map((i) => {
    const w = (i.payload.answer || i.payload.question || "").toUpperCase().replace(/[^A-Z]/g, '');
    return {
      id: i.id,
      word: w,
      startLetter: w.charAt(0) || 'A',
      endLetter: w.charAt(w.length-1) || 'A'
    };
  }) : [
    { id: '1', word: 'POMME', startLetter: 'P', endLetter: 'E' },
    { id: '2', word: 'ELEPHANT', startLetter: 'E', endLetter: 'T' }
  ]);
  
  const timer = config?.timerSeconds || 8;
  const [chain, setChain] = useState<ChainReactionWord[]>([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timer);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [usedIds, setUsedIds] = useState(new Set<string>());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startWord = wordBank[Math.floor(Math.random()*wordBank.length)] || { id: 'x', word: 'X', startLetter: 'X', endLetter: 'X' };
  const [firstWord] = useState(startWord);

  useEffect(() => {
    if (done) return;
    setTimeLeft(timer);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { 
          if (timerRef.current) clearInterval(timerRef.current); 
          setDone(true); 
          onComplete?.(chain.length*20); 
          return 0; 
        }
        return t-1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [chain.length, done, timer, onComplete]);

  const lastWord = chain.length > 0 ? chain[chain.length-1] : firstWord;
  const neededLetter = lastWord.endLetter;

  const submit = useCallback(() => {
    const val = input.toUpperCase().trim();
    if (!val) return;
    
    const match = wordBank.find((w: ChainReactionWord) => w.word===val && !usedIds.has(w.id) && w.startLetter===neededLetter);
    if (!match) {
      setError(val.startsWith(neededLetter) ? 'Mot non trouvé dans la banque !' : `Doit commencer par la lettre "${neededLetter}" !`);
      setTimeout(() => setError(''), 1500);
      if (onResponse && chain.length > 0) onResponse(chain[chain.length-1].id, 1);
    } else {
      if (onResponse) onResponse(match.id, 3);
      setChain(c => [...c, match]);
      setUsedIds(s => new Set([...s, match.id]));
      setInput('');
      setError('');
    }
  }, [input, wordBank, usedIds, neededLetter, onResponse, chain]);

  if (done) {
    return (
      <GameResult 
        state="win"
        title={`Chaîne de ${chain.length} mots !`}
        points={chain.length * 20}
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
          Chaîne de mots
        </span>
        <span 
          className="text-xs font-bold" 
          style={{ color: timeLeft <= 3 ? theme.colors.danger : theme.colors.muted }}
        >
          ⏱ {timeLeft}s
        </span>
      </div>

      {/* Timer Bar */}
      <div className="h-1 w-full" style={{ backgroundColor: border }}>
        <div 
          className="h-full transition-all duration-1000 ease-linear" 
          style={{ 
            backgroundColor: timeLeft > timer * 0.4 ? theme.colors.success : theme.colors.danger, 
            width: `${(timeLeft / timer) * 100}%` 
          }}
        />
      </div>

      <div className="flex-1 p-5 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Current Word Card */}
        <div 
          className="p-5 text-center"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            border: `1px solid ${border}`,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.colors.muted }}>
            Mot actuel
          </div>
          <div className="font-extrabold text-3xl mb-3" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {lastWord.word}
          </div>
          <div className="text-[13px] font-bold" style={{ color: theme.colors.primary }}>
            Prochain mot commence par : <span className="text-2xl ml-1">"{neededLetter}"</span>
          </div>
        </div>
        
        {/* Input */}
        <div className="flex gap-2">
          <input 
            ref={inputRef} 
            value={input} 
            onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={`Mot commençant par "${neededLetter}"…`}
            className="flex-1 p-3 outline-none transition-colors"
            style={{ 
              backgroundColor: theme.colors.surface, 
              border: `2px solid ${error ? theme.colors.danger : border}`, 
              borderRadius: radCard, 
              color: theme.colors.ink, 
              fontFamily: theme.fonts.display, 
              fontWeight: 700, 
              fontSize: 14 
            }} 
          />
          <button 
            onClick={submit} 
            className="px-5 border-none font-bold cursor-pointer active:scale-95 transition-transform"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: '#fff', 
              borderRadius: radCard, 
              fontFamily: theme.fonts.display 
            }}
          >
            →
          </button>
        </div>
        {error && (
          <div className="text-[13px] font-bold text-center animate-in fade-in" style={{ color: theme.colors.danger }}>
            {error}
          </div>
        )}
        
        {/* Chain Display */}
        <div className="flex flex-col gap-2 overflow-auto py-2 flex-1">
          {[firstWord, ...chain].map((w, i) => (
            <div key={i} className="flex items-center gap-3 text-xs" style={{ color: theme.colors.muted }}>
              <span className="w-5 text-right font-medium opacity-50">{i + 1}</span>
              <span className="w-5 text-center">{i === 0 ? '🎯' : '→'}</span>
              <span className="font-bold text-sm" style={{ color: theme.colors.ink }}>{w.word}</span>
            </div>
          ))}
          {/* Scroll anchor */}
          <div />
        </div>

        <div className="text-[11px] text-center pt-2 mt-auto" style={{ color: theme.colors.muted }}>
          Chaîne actuelle : {chain.length} mots · {chain.length * 20} pts
        </div>
      </div>
    </div>
  );
}
