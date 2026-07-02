import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme, useThemeTokens, AppColors } from '../store/useTheme';
import { BaseGameProps } from '../types';
import { VoiceRecordingData } from '../types/mechanics';
import GameResult from '../components/GameResult';

interface WaveBarProps {
  active: boolean;
  idx: number;
  C: AppColors;
}

function WaveBar({ active, idx, C }: WaveBarProps) {
  const height = active ? (Math.sin(idx*0.8 + Date.now()*0.003)*30+40) : 4;
  return (
    <div 
      className="w-[3px] rounded-full shrink-0 transition-[height]"
      style={{ 
        backgroundColor: active ? C.primary : 'rgba(255,255,255,.15)', 
        height, 
        transitionDuration: '0.1s' 
      }} 
    />
  );
}

export default function VoiceRecording({ items, data, onBack, onComplete, onResponse, isEmbedded }: BaseGameProps & { data?: VoiceRecordingData }) {
  const { theme } = useTheme();
  const tokens = useThemeTokens();
  const { border, radCard, radBtn, shadow } = tokens;
  const C = theme.colors;

  const { config = {}, items: mappedItems = [] } = data || {};

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | playing_ref | recording | reviewing | rated
  const [attempts, setAttempts] = useState(0);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedBlob = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = mappedItems[idx];
  const maxAttempts = config?.maxAttempts || 3;

  useEffect(() => {
    if (phase==='recording') {
      timerRef.current = setInterval(() => setTick(t=>t+1), 100);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, [phase]);

  const playRef = () => {
    if (!item) return;
    setPhase('playing_ref');
    if (item.referenceAudio && audioRef.current) {
      audioRef.current.play();
      audioRef.current.onended = () => setPhase('idle');
    } else {
      setTimeout(() => setPhase('idle'), 2000);
    }
  };

  const startRec = useCallback(async () => {
    if (attempts >= maxAttempts) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaStream.current = stream;
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
      mr.onstop = () => {
        recordedBlob.current = new Blob(chunks, { type:'audio/webm' });
        if (recAudioRef.current) recAudioRef.current.src = URL.createObjectURL(recordedBlob.current);
        setPhase('reviewing');
        stream.getTracks().forEach(t=>t.stop());
      };
      mediaRecorder.current = mr;
      mr.start();
      setPhase('recording');
      setAttempts(a=>a+1);
    } catch {
      alert("Microphone non autorisé. Cette fonctionnalité requiert l'accès au micro.");
      setPhase('idle');
    }
  }, [attempts, maxAttempts]);

  const stopRec = () => { mediaRecorder.current?.stop(); };

  const playRecording = () => { recAudioRef.current?.play(); };

  const rate = (r: number) => {
    setSelfScore(r);
    const pts = r * 15;
    setScore((s)=>s+pts);
    if (item?.itemId && onResponse) {
      onResponse(item.itemId, r === 4 ? 5 : r === 3 ? 3 : 1);
    }
    setPhase('rated');
  };

  const next = () => {
    setSelfScore(null); setAttempts(0); recordedBlob.current=null; setPhase('idle');
    if (idx+1 >= mappedItems.length) { setDone(true); onComplete?.(score); }
    else setIdx((i)=>i+1);
  };

  if (done) {
    return (
      <GameResult 
        state="win"
        title="Session terminée !"
        points={score}
        onBack={onBack}
      />
    );
  }

  if (!item) return (
    <div className={`${isEmbedded ? 'min-h-full h-full' : 'min-h-screen'} flex flex-col items-center justify-center p-6 text-center`} style={{ backgroundColor: theme.colors.bg }}>
      <div className="text-6xl mb-4">🎤</div>
      <div className="font-extrabold text-2xl mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
        Aucune phrase disponible
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
          Prononciation
        </span>
        <span className="text-xs font-bold" style={{ color: theme.colors.muted }}>
          {idx+1}/{mappedItems.length}
        </span>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-5 max-w-lg mx-auto w-full">
        {/* Texte à prononcer */}
        <div 
          className="p-5 border text-center flex flex-col items-center"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border,
            boxShadow: shadow
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: theme.colors.muted }}>
            Prononce cette phrase
          </div>
          <div className="font-extrabold text-[22px] leading-snug mb-2" style={{ fontFamily: theme.fonts.display, color: theme.colors.ink }}>
            {item.text}
          </div>
          {item.phonetic && (
            <div className="text-[13px] font-serif italic mb-2" style={{ color: theme.colors.muted }}>
              /{item.phonetic}/
            </div>
          )}
          <div className="flex gap-1 mt-1 justify-center">
            {Array.from({length: item.difficulty || 1}).map((_,i) => (
              <span key={i} className="text-[12px]">⭐</span>
            ))}
          </div>
        </div>

        {/* Waveform */}
        <div 
          className="p-3 border flex items-center justify-center gap-[3px] h-16 overflow-hidden"
          style={{ 
            backgroundColor: theme.colors.surface, 
            borderRadius: radCard, 
            borderColor: border 
          }}
        >
          {Array.from({length:40}).map((_,i) => (
            <WaveBar key={i} active={phase==='recording'} idx={i} C={C} />
          ))}
        </div>

        {/* Contrôles */}
        <div className="flex flex-col gap-3">
          {item.referenceAudio && <audio ref={audioRef} src={item.referenceAudio} />}
          <audio ref={recAudioRef} />

          <button 
            onClick={playRef} 
            disabled={phase==='recording'} 
            className="p-3.5 rounded-xl border font-bold text-sm transition-all"
            style={{ 
              backgroundColor: 'rgba(43,90,160,.25)', 
              borderColor: 'rgba(43,90,160,.5)', 
              color: '#93c5fd', 
              fontFamily: theme.fonts.display, 
              cursor: phase==='recording' ? 'default' : 'pointer',
              opacity: phase==='recording' ? 0.5 : 1
            }}
          >
            {phase==='playing_ref' ? '▶ Référence en cours…' : '▶ Écouter la référence'}
          </button>

          {phase==='idle' && (
            <button 
              onClick={startRec} 
              disabled={attempts>=maxAttempts} 
              className="p-3.5 rounded-xl border font-bold text-sm transition-transform active:scale-95"
              style={{ 
                backgroundColor: attempts<maxAttempts ? 'rgba(192,57,43,.25)' : 'rgba(255,255,255,.05)', 
                borderColor: attempts<maxAttempts ? theme.colors.danger : 'rgba(255,255,255,.1)', 
                color: attempts<maxAttempts ? '#fca5a5' : theme.colors.muted, 
                fontFamily: theme.fonts.display, 
                cursor: attempts<maxAttempts ? 'pointer' : 'default' 
              }}
            >
              🎙️ {attempts<maxAttempts ? `Enregistrer (essai ${attempts+1}/${maxAttempts})` : 'Tentatives épuisées'}
            </button>
          )}
          
          {phase==='recording' && (
            <button 
              onClick={stopRec} 
              className="p-3.5 rounded-xl border font-bold text-sm cursor-pointer animate-pulse"
              style={{ 
                backgroundColor: 'rgba(192,57,43,.3)', 
                borderColor: theme.colors.danger, 
                color: '#fca5a5', 
                fontFamily: theme.fonts.display 
              }}
            >
              ⏹ Arrêter l'enregistrement
            </button>
          )}

          {(phase==='reviewing' || phase==='rated') && (
            <button 
              onClick={playRecording} 
              className="p-3.5 rounded-xl border font-bold text-sm cursor-pointer active:scale-95 transition-transform"
              style={{ 
                backgroundColor: 'rgba(45,122,79,.2)', 
                borderColor: theme.colors.success, 
                color: '#4ade80', 
                fontFamily: theme.fonts.display 
              }}
            >
              ▶ Réécouter mon enregistrement
            </button>
          )}
        </div>

        {/* Auto-évaluation */}
        {phase==='reviewing' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-2">
            <div className="text-[12px] font-bold uppercase tracking-wider mb-3 text-center" style={{ color: theme.colors.muted }}>
              Comment était ta prononciation ?
            </div>
            <div className="flex gap-2 justify-center">
              {[
                {r:1, label:'😬 Difficile'},
                {r:2, label:'🙂 Passable'},
                {r:3, label:'😊 Bon'},
                {r:4, label:'🤩 Excellent'}
              ].map(({r,label}) => (
                <button 
                  key={r} 
                  onClick={() => rate(r)} 
                  className="flex-1 py-2.5 px-1 border rounded-xl text-[10px] sm:text-xs font-bold leading-tight cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,.06)', 
                    borderColor: border, 
                    color: theme.colors.ink 
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase==='rated' && (
          <div className="flex flex-col gap-3 animate-in fade-in">
            <div className="text-center text-sm font-bold" style={{ color: theme.colors.success }}>
              ✓ Auto-évaluation enregistrée · +{selfScore && selfScore*15} pts
            </div>
            <button 
              onClick={next} 
              className="w-full py-4 border-none font-bold text-[15px] cursor-pointer transition-transform active:scale-95 mt-2"
              style={{ 
                backgroundColor: theme.colors.primary, 
                color: '#fff', 
                borderRadius: radBtn, 
                fontFamily: theme.fonts.display 
              }}
            >
              {idx+1<mappedItems.length ? 'Phrase suivante →' : 'Voir résultats'}
            </button>
          </div>
        )}

        <div className="text-[11px] text-center mt-auto opacity-50" style={{ color: theme.colors.muted }}>
          Note : requiert un navigateur avec accès au microphone
        </div>
      </div>
    </div>
  );
}