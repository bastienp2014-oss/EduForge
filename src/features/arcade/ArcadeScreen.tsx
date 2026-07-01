import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Info, Grid, SortAsc, Type, Volume2, Lock, Gamepad2, Star, Sparkles } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { useGames } from '../../store/useGames';
import ModalInstructions, { GameType } from '../../components/ModalInstructions';

export default function ArcadeScreen({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { setPremium, getFeatureFlags } = useProgression();
  const { theme } = useTheme();
  const games = useGames(s => s.games);
  const [instructionsGame, setInstructionsGame] = useState<GameType | null>(null);
  
  const flags = getFeatureFlags();

  const enabledGames = games.filter(g => g.enabled);

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-12 overflow-y-auto w-full font-sans relative" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
      {/* Background Arcade Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: `linear-gradient(${theme.colors.primary} 1px, transparent 1px), linear-gradient(90deg, ${theme.colors.primary} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
      ></div>

      <div className="w-full max-w-[500px] px-6 relative z-10">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 shadow-2xl text-white mb-8 mt-2 flex border border-indigo-400/30 items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-8 opacity-20 pointer-events-none">
            <Gamepad2 size={120} />
          </div>
          <div className="bg-white/20 p-4 rounded-2xl shrink-0 backdrop-blur-sm relative z-10">
            <span className="text-3xl">🕹️</span>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black font-display tracking-tight leading-none mb-2 drop-shadow-sm">L'Arcade</h1>
            <p className="text-sm leading-relaxed font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Entraînement libre. Viens farmer tes PIASSES sans pression dans la salle de jeux.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          
          {enabledGames.map(game => (
            <div key={game.id} className="flex gap-2 w-full group">
              <button
                onClick={() => flags.feature_mini_games ? navigate(`/game/${game.id}`) : navigate('/paywall')}
                className={`flex-1 flex items-center justify-center gap-3 border-2 p-5 rounded-2xl font-bold font-display tracking-tight text-[16px] transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(79,70,229,0.15)] ${!flags.feature_mini_games ? 'opacity-75 grayscale' : ''}`}
                style={{ backgroundColor: theme.colors.surface, borderColor: 'rgba(79,70,229,0.3)', color: theme.colors.ink }}
              >
                <span className="text-xl">{game.icon}</span>
                {game.name} { !flags.feature_mini_games && <Lock className="w-4 h-4 text-amber-500" /> }
              </button>
              <button
                onClick={() => setInstructionsGame(game.id as any)}
                className="px-5 flex items-center justify-center border-2 rounded-2xl transition-all shrink-0"
                style={{ backgroundColor: theme.colors.surface, borderColor: 'rgba(79,70,229,0.3)', color: theme.colors.muted }}
              >
                <Info className="w-6 h-6" />
              </button>
            </div>
          ))}

          <div className="pt-8 pb-4 border-t mt-8" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4 font-mono text-center" style={{ color: theme.colors.muted }}>
              Machines Hors-Service
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 opacity-50 relative overflow-hidden pb-5" style={{ backgroundColor: `${theme.colors.surface}80`, borderColor: 'var(--color-border)' }}>
                <div className="absolute inset-0 backdrop-blur-[1px]" style={{ backgroundColor: `${theme.colors.bg}66` }}></div>
                <div className="flex flex-col items-center gap-2 font-bold text-sm font-display relative z-10" style={{ color: theme.colors.ink }}>
                  <Grid className="w-6 h-6" style={{ color: theme.colors.muted }} />
                  <span>Mots Croisés du Plateau</span>
                  <div className="text-[10px] px-2 py-0.5 rounded font-sans tracking-wide mt-1" style={{ backgroundColor: theme.colors.surface, color: theme.colors.muted }}>BIENTÔT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {instructionsGame && <ModalInstructions game={instructionsGame} onClose={() => setInstructionsGame(null)} />}
      </AnimatePresence>
    </div>
  );
}
