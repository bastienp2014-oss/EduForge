/**
* AUDIO PLAYER — Mots & Blocs
*
* Composant réutilisable pour jouer l'audio québécois.
*
* Hiérarchie des sources :
* 1. audioUrl réel (Firebase Storage) si présent
* 2. Web Speech API fr-CA si disponible
* 3. Synthèse générique avec label honnête
*
* Vitesse : slider 0.60–1.50 (incrément 0.05) + boutons rapides
* Persistance : vitesse lue depuis useProgression.audioSpeed
*/
import { useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { useQuebecVoice } from '../hooks/useQuebecVoice';
import { useProgression } from '../store/useProgression';

// ─── Types ────────────────────────────────────────────────────────
interface AudioPlayerProps {
  text: string; // Texte à lire (toujours requis — fallback TTS)
  audioUrl?: string; // URL Firebase Storage (optionnel)
  lang?: string; // Langue (défaut: 'fr-CA')
  compact?: boolean; // Mode compact (juste le bouton play)
  showSpeedControl?: boolean; // Afficher les contrôles de vitesse (défaut: true)
}

// ─── Labels de vitesse ────────────────────────────────────────────
function getSpeedLabel(speed: number): string {
  if (speed <= 0.70) return 'Très lent';
  if (speed <= 0.85) return 'Lent';
  if (speed <= 1.05) return 'Normal';
  if (speed <= 1.20) return 'Naturel';
  if (speed <= 1.35) return 'Rapide';
  return 'Très rapide';
}

// ─── Vitesse par défaut selon le niveau ──────────────────────────
export function defaultSpeedForNiveau(niveau: number): number {
  if (niveau <= 1) return 0.65;
  if (niveau <= 2) return 0.75;
  if (niveau <= 3) return 0.85;
  if (niveau <= 4) return 1.00;
  return 1.10;
}

// ─── Boutons rapides ──────────────────────────────────────────────
const QUICK_SPEEDS = [
  { label: '🐢 Lent', value: 0.65 },
  { label: '📖 Normal', value: 1.00 },
  { label: '🗣️ Naturel', value: 1.15 },
  { label: '⚡ Rapide', value: 1.35 },
];

// ─── Composant principal ──────────────────────────────────────────
export default function AudioPlayer({
  text,
  audioUrl,
  lang = 'fr-CA',
  compact = false,
  showSpeedControl = true,
}: AudioPlayerProps) {
  const audioSpeed = useProgression(s => s.audioSpeed);
  const setAudioSpeed = useProgression(s => s.setAudioSpeed);
  const getNiveau = useProgression(s => s.getNiveau);
  const { engine, isLoading, voiceLabel, hasNativeQuebecVoice } = useQuebecVoice();
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Vitesse courante — depuis le store (persistée)
  const speed = audioSpeed ?? defaultSpeedForNiveau(getNiveau());

  // ── Lecture ────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      // Arrêt
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      engine?.stop();
      setIsPlaying(false);
      return;
    }
    
    setError(null);
    setIsPlaying(true);
    
    try {
      if (audioUrl) {
        // Source 1 : audio réel (Firebase Storage)
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.playbackRate = speed;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setError('Erreur lecture audio');
          setIsPlaying(false);
        };
        await audio.play();
      } else if (engine) {
        // Source 2 : Web Speech API (fr-CA ou générique)
        await engine.speak(text, speed, lang);
        setIsPlaying(false);
      } else {
        setError('Audio non disponible');
        setIsPlaying(false);
      }
    } catch {
      setError('Erreur lecture');
      setIsPlaying(false);
    }
  }, [isPlaying, audioUrl, engine, text, speed, lang]);

  // ── Changement de vitesse ──────────────────────────────────────
  const handleSpeedChange = (newSpeed: number) => {
    const rounded = Math.round(newSpeed * 20) / 20; // Arrondi au 0.05 le plus proche
    setAudioSpeed(rounded);
    
    // Si audio en cours, met à jour la vitesse à la volée
    if (audioRef.current) {
      audioRef.current.playbackRate = rounded;
    }
  };

  // ── Mode compact (juste le bouton) ────────────────────────────
  if (compact) {
    return (
      <button
        onClick={handlePlay}
        disabled={isLoading || (!audioUrl && !engine)}
        aria-label={isPlaying ? 'Arrêter la lecture' : `Écouter : ${text}`}
        className={`
          w-9 h-9 rounded-full flex items-center justify-center transition-all
          ${isPlaying
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
          }
          disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-95
        `}
      >
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isPlaying
            ? <VolumeX className="w-4 h-4" />
            : <Volume2 className="w-4 h-4" />
        }
      </button>
    );
  }

  // ── Mode complet ───────────────────────────────────────────────
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-4">
      {/* ── Ligne principale : bouton + source ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlay}
          disabled={isLoading || (!audioUrl && !engine)}
          aria-label={isPlaying ? 'Arrêter' : `Écouter : ${text}`}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            transition-all active:scale-95 shrink-0
            ${isPlaying
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 animate-pulse'
              : 'bg-white text-blue-600 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          {isLoading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : isPlaying
              ? <VolumeX className="w-5 h-5" />
              : <Volume2 className="w-5 h-5" />
          }
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm truncate">{text}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {audioUrl ? (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Audio enregistré
              </span>
            ) : hasNativeQuebecVoice ? (
              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Voix québécoise
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {voiceLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* ── Erreur ── */}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      
      {/* ── Contrôles de vitesse ── */}
      {showSpeedControl && (
        <div className="space-y-3">
          {/* Boutons rapides */}
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK_SPEEDS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleSpeedChange(value)}
                className={`
                  text-xs font-bold py-1.5 px-1 rounded-lg border transition-all
                  ${Math.abs(speed - value) < 0.03
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Slider fin */}
          <div className="space-y-1">
            <input
              type="range"
              min={0.60}
              max={1.50}
              step={0.05}
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              aria-label="Vitesse de lecture"
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-600
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">0.60x</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {speed.toFixed(2)}x — {getSpeedLabel(speed)}
              </span>
              <span className="text-xs text-slate-400">1.50x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
