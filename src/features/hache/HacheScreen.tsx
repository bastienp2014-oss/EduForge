/**
 * HACHE SCREEN — Mots & Blocs (Phase 8c — Polish visuel CSS)
 *
 * ─────────────────────────────────────────────────────────────────
 * Vue première personne immersive — zéro Three.js, CSS pur.
 * Logique de jeu IDENTIQUE à l'original — seul le visuel change.
 *
 * Nouveautés visuelles :
 * - Fond : forêt de pins CSS (gradients + arbres SVG inline)
 * - Cible : anneaux SVG colorés (rouge/orange/jaune/blanc)
 * - Hache : SVG qui part du bas, tourne (rotate), monte (translateY)
 * - Impact : cible qui tremble (shake), éclats CSS (particules)
 * - Pas de main visible — caméra = yeux de l'utilisateur
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import AudioPlayer from '../../components/AudioPlayer';
import motsData from '../../data/mots.json';
import GameHUD from '../../components/GameHUD';
import GameButton from '../../components/GameButton';
import GameResult from '../../components/GameResult';

// ─── Types ────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  phrase: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ─── Génération des challenges (identique à l'original) ───────────
const generateAxeChallenges = (count: number, availableWords: typeof motsData): Challenge[] => {
  let expressions = availableWords.filter(m => m.theme && m.theme.includes('Expression'));
  if (expressions.length === 0) expressions = availableWords;

  const shuffled = [...expressions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, expressions.length));

  return selected.map((expr, index) => {
    let distractors = expressions
      .filter(m => m.id !== expr.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(m => m.definition);

    if (distractors.length < 2) {
      distractors = ["C'est fatiguant.", "Ça ne veut rien dire."].slice(0, 2);
    }

    const options = [...distractors, expr.definition];
    const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
    const correctIndex = shuffledOptions.indexOf(expr.definition);

    return {
      id: `h_dyn_${expr.id}_${index}`,
      phrase: expr.exemple ? expr.exemple : expr.mot,
      options: shuffledOptions,
      correctIndex,
      explanation: expr.definition,
    };
  });
};

// ─── Sons synthétiques (identique à l'original) ───────────────────
const playSynthSound = (type: 'chop' | 'success' | 'fail' | 'swoosh') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'swoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'chop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn("AudioContext indisponible.", err);
  }
};

// ─── SVG Cible ────────────────────────────────────────────────────
function Target({ isShaking }: { isShaking: boolean }) {
  return (
    <motion.div
      animate={isShaking ? {
        x: [0, -8, 8, -6, 6, -4, 4, 0],
        rotate: [0, -2, 2, -1, 1, 0],
      } : { x: 0, rotate: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative"
    >
      {/* Bûche de bois (fond) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 40% 35%, #a0522d, #5c2e0e)',
          boxShadow: 'inset -4px -4px 12px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      />
      {/* Anneaux SVG */}
      <svg viewBox="0 0 200 200" className="w-48 h-48 relative z-10 drop-shadow-2xl">
        {/* Anneau extérieur — blanc */}
        <circle cx="100" cy="100" r="95" fill="white" />
        {/* Anneau noir */}
        <circle cx="100" cy="100" r="80" fill="#1a1a1a" />
        {/* Anneau bleu */}
        <circle cx="100" cy="100" r="65" fill="#1e3a8a" />
        {/* Anneau rouge */}
        <circle cx="100" cy="100" r="50" fill="#dc2626" />
        {/* Anneau or */}
        <circle cx="100" cy="100" r="35" fill="#f59e0b" />
        {/* Centre rouge vif */}
        <circle cx="100" cy="100" r="18" fill="#ef4444" />
        {/* Brillance */}
        <circle cx="88" cy="88" r="6" fill="rgba(255,255,255,0.3)" />
        {/* Lignes de fibres bois (texture) */}
        {[20, 40, 60, 80, 100, 120, 140, 160, 180].map(r => (
          <circle key={r} cx="100" cy="100" r={r * 0.9} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── SVG Hache animée ─────────────────────────────────────────────
function FlyingAxe({ isFlying, isLanded, isCorrect, targetRef }: {
  isFlying: boolean;
  isLanded: boolean;
  isCorrect: boolean | null;
  targetRef?: React.RefObject<HTMLDivElement>;
}) {
  if (!isFlying && !isLanded) return null;

  let animateProps;
  if (isLanded) {
    if (isCorrect !== false) {
      animateProps = { y: -40, x: 0, rotate: 45, opacity: 1, scale: 0.9 };
    } else {
      animateProps = { y: -20, x: 140, rotate: 120, opacity: 0.8, scale: 0.5 };
    }
  } else {
    if (isCorrect !== false) {
      animateProps = { y: -40, x: 0, rotate: [0, 180, 360, 540, 600], opacity: 1, scale: 0.9 };
    } else {
      animateProps = { y: -20, x: 140, rotate: [0, 180, 360, 540, 660], opacity: 0.8, scale: 0.5 };
    }
  }

  return (
    <motion.div
      initial={{ y: 300, x: 0, rotate: 0, opacity: 1, scale: 0.6 }}
      animate={animateProps}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    >
      <svg viewBox="0 0 80 120" className="w-16 h-24 drop-shadow-2xl">
        {/* Manche */}
        <rect x="36" y="40" width="8" height="75" rx="4" fill="#8B4513" />
        <rect x="37" y="40" width="2" height="75" rx="2" fill="#A0522D" opacity="0.5" />
        {/* Tête de hache */}
        <path d="M20 10 L60 10 L65 40 L15 40 Z" fill="#708090" />
        <path d="M20 10 L60 10 L58 15 L22 15 Z" fill="#A0A0A0" />
        <path d="M15 40 L65 40 L60 45 L20 45 Z" fill="#606070" />
        {/* Fil tranchant */}
        <path d="M15 40 L65 40 L60 50 L20 50 Z" fill="#C0C0C8" />
        {/* Brillance */}
        <path d="M22 12 L50 12 L48 18 L24 18 Z" fill="rgba(255,255,255,0.3)" />
      </svg>
    </motion.div>
  );
}

// ─── Éclats de bois ───────────────────────────────────────────────
function WoodChips({ chips }: { chips: { id: number; x: number; y: number; r: number }[] }) {
  return (
    <>
      {chips.map(chip => (
        <motion.div
          key={chip.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: chip.x, y: chip.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 w-3 h-1.5 rounded-sm pointer-events-none z-20"
          style={{
            background: `hsl(${25 + Math.random() * 15}, 60%, ${40 + Math.random() * 20}%)`,
            rotate: `${chip.r}deg`,
          }}
        />
      ))}
    </>
  );
}

// ─── Écran principal ──────────────────────────────────────────────
export default function HacheScreen({ onBack }: { onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [axeState, setAxeState] = useState<'idle' | 'flying' | 'landed'>('idle');
  const [thrownIndex, setThrownIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [chips, setChips] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  const [axeChallenges, setAxeChallenges] = useState<Challenge[]>([]);
  const targetRef = React.useRef<HTMLDivElement>(null);

  const { claimReward, getNiveau, getPointsConfig } = useProgression();
  const { theme } = useTheme();

  const availableWords = useMemo(() => {
    const niveau = getNiveau();
    const validPacks = ['1_survie'];
    if (niveau >= 2) validPacks.push('2_installation');
    if (niveau >= 3) validPacks.push('3_travailler');
    if (niveau >= 4) validPacks.push('4_culture');
    return (motsData as any[]).filter(m => validPacks.includes(m.pack));
  }, [getNiveau]);

  useEffect(() => {
    setAxeChallenges(generateAxeChallenges(10, availableWords as any));
  }, [availableWords]);

  const challenge = axeChallenges[currentIndex];

  const handleLaunchAxe = (targetIndex: number) => {
    if (axeState !== 'idle' || lives <= 0 || gameFinished || !challenge) return;

    useProgression.getState().incrementStat('hache_played');
    setThrownIndex(targetIndex);
    setAxeState('flying');

    const correct = targetIndex === challenge.correctIndex;
    setIsCorrect(correct);

    playSynthSound('swoosh');

    setTimeout(() => {
      setAxeState('landed');

      if (correct) {
        playSynthSound('success');
        setTimeout(() => playSynthSound('chop'), 100);
        setScore(prev => prev + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > highStreak) setHighStreak(newStreak);
        claimReward('hache_correct');

        setChips(Array.from({ length: 18 }).map((_, i) => ({
          id: Math.random() + i,
          x: (Math.random() - 0.5) * 220,
          y: (Math.random() - 0.5) * 220,
          r: Math.random() * 360,
        })));
      } else {
        playSynthSound('fail');
        setStreak(0);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) setTimeout(() => setGameFinished(true), 2000);
          return newLives;
        });
      }

      setShowExplanation(true);
    }, 500);
  };

  const nextChallenge = () => {
    setShowExplanation(false);
    setAxeState('idle');
    setThrownIndex(null);
    setIsCorrect(null);
    setChips([]);

    if (currentIndex + 1 < axeChallenges.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameFinished(true);
    }
  };

  const restartGame = () => {
    setAxeChallenges(generateAxeChallenges(10, availableWords as any));
    setCurrentIndex(0); setScore(0); setStreak(0);
    setLives(3); setAxeState('idle'); setThrownIndex(null);
    setIsCorrect(null); setChips([]); setShowExplanation(false);
    setGameFinished(false);
  };

  if (!challenge && !gameFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.colors.bg }}>
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Commentaires de Gaston ──────────────────────────────────────
  const getGastonComment = () => {
    if (gameFinished) {
      return score >= 7
        ? "Viens faire un tour dans l'bois ! T'es un vrai bûcheron ! 🏅"
        : "C'était pas si pire ! Une p'tite frousse pis on s'y remet ! 🩹";
    }
    if (axeState === 'landed' && isCorrect !== null) {
      return isCorrect
        ? ["VLAN ! Plein dans le mille ! 🎯", "C'est tiguidou ! ✨", "BINGO ! T'es une machine !"][currentIndex % 3]
        : "Ah baptême ! Vise la bonne bûche prochaine fois ! 🪵";
    }
    return "Laisse planer ta hache sur la bûche qui correspond ! 🪓";
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden select-none relative" style={{
      background: theme.colors.bg
    }}>
      {/* ── Forêt CSS en arrière-plan ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        {/* Ciel étoilé */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at top, #0a1628 0%, #050a10 60%)'
        }} />

        {/* Lune */}
        <div className="absolute top-8 right-12 w-12 h-12 rounded-full bg-amber-100 opacity-80 shadow-[0_0_40px_rgba(251,191,36,0.4)]" />

        {/* Arbres silhouette couche arrière */}
        {[8, 18, 28, 38, 48, 58, 68, 78, 88].map((left, i) => (
          <div key={i} className="absolute bottom-0"
            style={{ left: `${left}%`, width: `${6 + (i % 3)}%` }}>
            <div style={{
              width: '100%',
              height: `${120 + (i % 4) * 30}px`,
              background: 'linear-gradient(180deg, #0d2010 0%, #0a1a0c 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              opacity: 0.6 + (i % 3) * 0.1,
            }} />
          </div>
        ))}

        {/* Arbres silhouette premier plan */}
        {[5, 20, 35, 65, 80, 92].map((left, i) => (
          <div key={i} className="absolute bottom-0"
            style={{ left: `${left}%`, width: `${8 + (i % 2) * 3}%` }}>
            <div style={{
              width: '100%',
              height: `${160 + (i % 3) * 40}px`,
              background: '#040d06',
              clipPath: 'polygon(50% 0%, 5% 60%, 20% 60%, 10% 80%, 25% 80%, 0% 100%, 100% 100%, 75% 80%, 90% 80%, 80% 60%, 95% 60%)',
            }} />
          </div>
        ))}

        {/* Sol */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: 'linear-gradient(180deg, #1a2e0a 0%, #0d1a05 100%)' }} />
      </div>

      {/* ── Header ── */}
      <GameHUD 
        title="L'ÉLAN DU BÛCHERON" 
        onBack={onBack} 
        extra={
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span key={i}
                animate={i < lives ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0.2 }}
                className="text-lg">🌲</motion.span>
            ))}
          </div>
        } 
      />

      {/* ── Stats ── */}
      <div className="relative z-10 grid grid-cols-3 gap-2 px-4 mb-3">
        {[
          { label: 'Cibles', value: `${score}/${axeChallenges.length}`, color: 'text-emerald-400' },
          { label: 'Série', value: `${streak} 🔥`, color: 'text-amber-400' },
          { label: 'Record', value: `${highStreak} 🏆`, color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-black/30 backdrop-blur-sm rounded-2xl p-2 text-center border border-white/5">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-sm font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Zone de jeu ── */}
      {!gameFinished ? (
        <div className="relative z-10 flex-1 flex flex-col px-4">
          {/* Bulle Gaston */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-3 border border-white/10 mb-4 flex items-start gap-3">
            <span className="text-2xl shrink-0">🧔🏽</span>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1">Gaston le Bûcheron</p>
              <p className="text-xs text-slate-200 italic leading-snug">{getGastonComment()}</p>
            </div>
            <AudioPlayer text={challenge?.phrase ?? ''} compact showSpeedControl={false} />
          </div>

          {/* Phrase à identifier */}
          <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-4 border border-amber-500/20 mb-4 text-center">
            <p className="text-white font-black text-lg leading-snug">{challenge?.phrase}</p>
          </div>

          {/* ── ARÈNE VISUELLE : cible + hache ── */}
          <div className="relative flex items-center justify-center mb-4" style={{ height: 220 }}>
            {/* Fond bûche / support */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)' }} />

            {/* Cible */}
            <div ref={targetRef} className="relative">
              <Target isShaking={axeState === 'landed' && isCorrect === true} />
              <WoodChips chips={chips} />
            </div>

            {/* Hache animée */}
            <FlyingAxe
              isFlying={axeState === 'flying'}
              isLanded={axeState === 'landed'}
              isCorrect={isCorrect}
              targetRef={targetRef}
            />

            {/* Flash résultat */}
            <AnimatePresence>
              {axeState === 'landed' && isCorrect !== null && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-black text-sm z-30 ${
                    isCorrect
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                      : 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                  }`}
                >
                  {isCorrect ? '🎯 DANS LE MILLE !' : '💨 RATÉ !'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Options de réponse ── */}
          {!showExplanation ? (
            <div className="grid grid-cols-1 gap-2">
              {challenge?.options.map((opt, i) => {
                let variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'secondary';
                if (axeState !== 'idle' && thrownIndex === i) {
                  variant = isCorrect ? 'success' : 'danger';
                } else if (axeState !== 'idle' && i === challenge.correctIndex && !isCorrect) {
                  variant = 'success';
                }
                
                return (
                  <GameButton
                    key={i}
                    fullWidth
                    variant={variant}
                    disabled={axeState !== 'idle'}
                    onPress={() => handleLaunchAxe(i)}
                    style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}
                  >
                    <span className="opacity-70 mr-2">{String.fromCharCode(65 + i)}.</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                  </GameButton>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <p className={`font-black text-sm mb-1 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isCorrect ? '✅ Bonne réponse !' : '❌ Mauvaise réponse'}
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">{challenge?.explanation}</p>
              </div>

              <GameButton
                fullWidth
                variant="primary"
                size="lg"
                onPress={nextChallenge}
              >
                {currentIndex + 1 < axeChallenges.length ? 'Prochain lancer →' : 'Voir les résultats'}
              </GameButton>
            </div>
          )}
        </div>
      ) : (
        /* ── Écran de fin ── */
        <GameResult
          state={score >= 7 ? 'win' : 'lose'}
          title={score >= 7 ? 'Bûcheron expert !' : 'Bonne session !'}
          subtitle={getGastonComment()}
          points={score * getPointsConfig().hacheCorrect}
          streak={highStreak}
          onReplay={restartGame}
          onBack={onBack}
        />
      )}
    </div>
  );
}
