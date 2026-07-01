/**
 * VILLE SCREEN — Mots & Blocs
 * Interactive city navigation hub matching the handoff design system.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ArrowLeft } from 'lucide-react';
import DepanneurScreen from '../depanneur/DepanneurScreen';
import ruesData from '../../data/rues.json';
import { useScenarioTrigger } from '../../hooks/useScenarioTrigger';
import ScenarioPlayer from '../scenarios/ScenarioPlayer';
import ScenarioHubScreen from '../scenarios/ScenarioHubScreen';
import { useProgression } from '../../store/useProgression';
import type { Scenario } from '../scenarios/scenarioEngine';
import { useTheme } from '../../store/useTheme';
import { useAppConfig } from '../../store/useAppConfig';

// ─── Types ────────────────────────────────────────────────────────
export type RueId = 'principale' | 'services' | 'logement' | 'travail' | 'etudes';

export type Rue = {
  id: RueId;
  nom: string;
  emoji: string;
  direction: 'nord' | 'est' | 'sud' | 'ouest' | null;
  couleur: string;
  statut: 'active' | 'bientot';
  niveau_requis: number;
  apercu: { emoji: string; label: string }[];
};

type VilleProps = {
  onBack: () => void;
};

// Vector transitions for sliding street views
const ENTREE: Record<string, { x: number; y: number }> = {
  nord: { x: 0, y: -100 }, // enters from top
  sud: { x: 0, y: 100 },  // enters from bottom
  est: { x: 100, y: 0 },   // enters from right
  ouest: { x: -100, y: 0 }, // enters from left
};

export default function VilleScreen({ onBack }: VilleProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeRue, setActiveRue] = useState<RueId>('principale');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  const [enterVec, setEnterVec] = useState({ x: 0, y: 0 });
  const [exitVec, setExitVec] = useState({ x: 0, y: 0 });
  const [viewingHub, setViewingHub] = useState<RueId | null>(null);
  const { features } = useAppConfig();
  
  const triggeredScenario = useScenarioTrigger(activeRue);
  const [playingScenario, setPlayingScenario] = useState<Scenario | null>(null);

  const userLevel = useProgression(s => s.getNiveau());

  useEffect(() => {
    if (triggeredScenario && !playingScenario) {
      setPlayingScenario(triggeredScenario);
    }
  }, [triggeredScenario]);

  useEffect(() => {
    if (lockedMessage) {
      const timer = setTimeout(() => setLockedMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [lockedMessage]);

  const handleScenarioComplete = (outcome: any, piasses: number, xp: number) => {
    if (playingScenario) {
      if (xp > 0) useProgression.getState().addXp(xp);
      if (piasses > 0) useProgression.getState().addPiasses(piasses);
      useProgression.getState().completerScenario(playingScenario.id, outcome.type);
    }
    setPlayingScenario(null);
  };

  const rues = ruesData as Rue[];
  const rueActive = rues.find(r => r.id === activeRue)!;
  const ruesSecondaires = rues.filter(r => r.id !== 'principale');

  const naviguerVers = (rueId: RueId) => {
    if (rueId === activeRue) return;
    if (rueId === 'principale') {
      const vec = ENTREE[rueActive.direction ?? 'est'];
      setExitVec(vec);
      setEnterVec({ x: -vec.x, y: -vec.y });
    } else {
      const cible = rues.find(r => r.id === rueId)!;
      const vec = ENTREE[cible.direction ?? 'est'];
      setExitVec({ x: -vec.x, y: -vec.y });
      setEnterVec(vec);
    }
    setActiveRue(rueId);
  };

  const handleShopClick = (shopId: string) => {
    if (!features.enableStore) {
      alert("La boutique est désactivée pour cette instance.");
      return;
    }
    setSelectedShopId(shopId);
  };

  // ─── Render inner shops of Rue Principale ───────────────────
  if (activeRue === 'principale' && selectedShopId) {
    return (
      <DepanneurScreen
        onBack={() => setSelectedShopId(null)}
       
        isEmbedded
        ruesSecondaires={ruesSecondaires}
        onNaviguerRue={naviguerVers}
        onOpenScenarios={() => setViewingHub('principale')}
        initialShop={selectedShopId}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden transition-colors duration-300" style={{ backgroundColor: theme.colors.background }}>
      {/* ── Header fixe ── */}
      <div className="fixed top-0 left-0 right-0 z-50 shadow-sm transition-colors duration-300" style={{ backgroundColor: theme.colors.surface, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center px-4 py-3 max-w-md mx-auto gap-3">
          {activeRue === 'principale' ? (
            <button
              onClick={onBack}
              className="transition-colors text-sm font-bold opacity-70 hover:opacity-100 flex items-center gap-1" style={{ color: theme.colors.text }}
            >
              <ArrowLeft className="w-4 h-4" /> Accueil
            </button>
          ) : (
            <button
              onClick={() => naviguerVers('principale')}
              className="transition-colors text-sm font-bold opacity-70 hover:opacity-100 flex items-center gap-1" style={{ color: theme.colors.text }}
            >
              <ArrowLeft className="w-4 h-4" /> Rue Principale
            </button>
          )}
          <div className="flex-1 text-center">
            <span className="font-black text-sm transition-colors duration-300" style={{ color: theme.colors.text }}>
              {rueActive.emoji} {rueActive.nom}
            </span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* ── Contenu animé ── */}
      <div className="pt-12 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRue}
            initial={{ x: `${enterVec.x}%`, y: `${enterVec.y}%`, opacity: 0.7 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: `${exitVec.x}%`, y: `${exitVec.y}%`, opacity: 0.7 }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }}
            className="h-[calc(100vh-48px)] overflow-y-auto overflow-x-hidden"
          >
            {activeRue === 'principale' ? (
              <div className="w-full">
                {/* En-tête de la Rue Principale */}
                <div className="flex items-center gap-3 mb-4 mt-4 px-4 max-w-md mx-auto">
                  <span className="font-display font-bold text-lg" style={{ color: theme.colors.text }}>🏘️ Rue Principale</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${theme.colors.success}15`, color: theme.colors.success, border: `1.5px solid ${theme.colors.success}30` }}>Tu es ici</span>
                </div>

                {/* Carte de la route centrale */}
                <div className="max-w-md mx-auto px-4 mb-6">
                  <div 
                    className="relative overflow-hidden p-6 transition-all duration-300 border"
                    style={{ 
                      borderRadius: 'var(--radius-card)',
                      boxShadow: 'var(--shadow-card)',
                      borderColor: 'var(--color-border)',
                      background: theme.dark 
                        ? 'linear-gradient(180deg, #162233 0%, #0d1b2a 100%)' 
                        : 'linear-gradient(180deg, oklch(0.93 0.02 250) 0%, oklch(0.96 0.014 70) 100%)'
                    }}
                  >
                    {/* Route centrale goudronnée */}
                    <div 
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[46px] shadow-inner transition-colors duration-300"
                      style={{ 
                        background: theme.dark
                          ? 'repeating-linear-gradient(180deg, #0f1a26 0 18px, #132233 18px 36px)'
                          : 'repeating-linear-gradient(180deg, oklch(0.78 0.01 260) 0 18px, oklch(0.74 0.01 260) 18px 36px)'
                      }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[3px]"
                      style={{ 
                        background: 'repeating-linear-gradient(180deg, var(--color-gold) 0 14px, transparent 14px 30px)'
                      }}
                    />

                    <div className="relative flex flex-col gap-8">
                      {/* Rangée 1 : Dépanneur & Arcade */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        {/* Dépanneur */}
                        <button
                          onClick={() => handleShopClick('depanneur')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)'
                          }}
                        >
                          <div className="text-4xl mb-1">🏪</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Dépanneur</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>

                        {/* Espace Route */}
                        <div />

                        {/* Arcade */}
                        <button
                          onClick={() => navigate && navigate('/')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)'
                          }}
                        >
                          <div className="text-4xl mb-1">🕹️</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Arcade</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>

                      {/* Pin joueur */}
                      <div className="text-center z-10">
                        <motion.div 
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                          className="inline-block text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] select-none cursor-default"
                        >
                          📍
                        </motion.div>
                      </div>

                      {/* Rangée 2 : Hôpital & École */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        {/* Hôpital */}
                        <button
                          onClick={() => handleShopClick('hopital')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)'
                          }}
                        >
                          <div className="text-4xl mb-1">🏥</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Hôpital</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>

                        {/* Espace Route */}
                        <div />

                        {/* École */}
                        {userLevel >= 6 ? (
                          <button
                            onClick={() => navigate && navigate('/')}
                            className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                            style={{ 
                              backgroundColor: 'var(--color-surface)',
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            <div className="text-4xl mb-1">🏫</div>
                            <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>École</div>
                            <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                          </button>
                        ) : (
                          <button
                            onClick={() => setLockedMessage("L'École requiert le Niveau 6 ! Continue d'apprendre pour y accéder.")}
                            className="rounded-[18px] p-3 text-center border shadow-sm opacity-65 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/40"
                            style={{ 
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            <div className="text-4xl mb-1 filter grayscale brightness-90">🏫</div>
                            <div className="font-display font-bold text-xs text-slate-400 dark:text-slate-500">École</div>
                            <div className="text-[9px] font-black tracking-wide mt-1 flex items-center justify-center gap-1 text-amber-600 dark:text-amber-500">
                              <Lock className="w-2.5 h-2.5" /> Niv. 6
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Rangée 3 : Épicerie & Resto */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        <button
                          onClick={() => handleShopClick('epicerie')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🛒</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Épicerie</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                        <div />
                        <button
                          onClick={() => handleShopClick('resto')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🍔</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Resto</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>

                      {/* Rangée 4 : SAAQ & Hôtel de Ville */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        <button
                          onClick={() => handleShopClick('saaq')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🚗</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>SAAQ</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                        <div />
                        <button
                          onClick={() => handleShopClick('hotel_de_ville')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🏛️</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Services</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>

                      {/* Rangée 5 : Transport & Boutiques */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        <button
                          onClick={() => handleShopClick('transport')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🚌</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Transport</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                        <div />
                        <button
                          onClick={() => handleShopClick('boutiques')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🛍️</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Boutiques</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>

                      {/* Rangée 6 : Quincaillerie & Garage */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        <button
                          onClick={() => handleShopClick('quincaillerie')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🔨</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Quincaillerie</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                        <div />
                        <button
                          onClick={() => handleShopClick('garage')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🔧</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Garage</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>

                      {/* Rangée 7 : Maison & Appartement */}
                      <div className="grid grid-cols-[1fr_46px_1fr] gap-2 items-center">
                        <button
                          onClick={() => handleShopClick('maison_shop')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🏠</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Maison</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                        <div />
                        <button
                          onClick={() => handleShopClick('appartement_shop')}
                          className="rounded-[18px] p-3 text-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] border shadow-sm"
                          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                        >
                          <div className="text-4xl mb-1">🏢</div>
                          <div className="font-display font-bold text-xs" style={{ color: theme.colors.text }}>Appartement</div>
                          <div className="text-[9px] font-black tracking-wide mt-1" style={{ color: theme.colors.success }}>● Ouvert</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rues secondaires cardinales */}
                <div className="max-w-md mx-auto px-4 pb-12">
                  <div className="font-display font-bold text-sm mb-3" style={{ color: theme.colors.text }}>Quitter la rue principale</div>
                  <div className="grid grid-cols-2 gap-3">
                    {ruesSecondaires.map((r) => {
                      const isLocked = userLevel < r.niveau_requis;
                      const dirLabel = r.direction === 'nord' ? '↑ Nord' : r.direction === 'ouest' ? '← Ouest' : r.direction === 'est' ? '→ Est' : r.direction === 'sud' ? '↓ Sud' : '';

                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            if (isLocked) {
                              setLockedMessage(`La ${r.nom} requiert le Niveau ${r.niveau_requis} !`);
                            } else {
                              naviguerVers(r.id);
                            }
                          }}
                          className={`rounded-2xl p-4 text-left border flex items-center gap-3 transition-all duration-200 ${isLocked ? 'opacity-65 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/40' : 'hover:scale-[1.02] active:scale-[0.98] shadow-sm'}`}
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)'
                          }}
                        >
                          <span className={`text-3xl ${isLocked ? 'filter grayscale brightness-75' : ''}`}>{r.emoji}</span>
                          <div className="min-w-0">
                            <div className="font-display font-bold text-xs truncate" style={{ color: isLocked ? 'var(--color-muted)' : theme.colors.text }}>
                              {r.nom.replace('Rue du ', '').replace('Rue des ', '').replace('Rue de la ', '')}
                            </div>
                            <div className={`text-[10px] font-semibold mt-0.5 ${isLocked ? 'text-amber-600 dark:text-amber-500 flex items-center gap-1' : 'opacity-70'}`} style={{ color: isLocked ? undefined : theme.colors.muted }}>
                              {isLocked ? (
                                <>
                                  <Lock className="w-2.5 h-2.5" /> Niv. {r.niveau_requis}
                                </>
                              ) : (
                                dirLabel
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <RueBientotScreen
                rue={rueActive}
                onRetour={() => naviguerVers('principale')}
                onOpenScenarios={() => setViewingHub(activeRue)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating locked alert toast */}
        <AnimatePresence>
          {lockedMessage && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed bottom-20 left-4 right-4 z-[100] max-w-sm mx-auto bg-amber-500 text-white font-bold text-xs p-3.5 rounded-xl shadow-lg flex items-center gap-2"
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>{lockedMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {playingScenario && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-white"
            >
              <ScenarioPlayer
                scenario={playingScenario}
                onComplete={handleScenarioComplete}
                compact={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingHub && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="absolute inset-0 z-[60] bg-white"
            >
              <ScenarioHubScreen
                rueId={viewingHub}
                onBack={() => setViewingHub(null)}
               
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Écran "Bientôt" pour les rues secondaires ───────────────────
function RueBientotScreen({ rue, onRetour, onOpenScenarios }: { rue: Rue; onRetour: () => void; onOpenScenarios: () => void }) {
  const { theme } = useTheme();
  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col items-center justify-center px-6 py-12 text-center transition-colors duration-300" style={{ color: theme.colors.text }}>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="w-full max-w-xs"
      >
        <div className="text-8xl mb-4">{rue.emoji}</div>
        <h2 className="text-2xl font-black mb-2" style={{ color: theme.colors.text }}>{rue.nom}</h2>
        
        <button
          onClick={onOpenScenarios}
          className="text-white font-black px-6 py-3 rounded-2xl w-full mb-6 shadow-md transition-transform active:scale-95"
          style={{ backgroundColor: theme.colors.primary }}
        >
          🎭 Voir les Scénarios
        </button>

        <p className="text-sm mb-6 leading-relaxed opacity-80">
          Cette rue ouvre bientôt avec ses boutiques et simulateurs interactifs.
        </p>

        <div
          className="rounded-2xl p-5 mb-8 text-left"
          style={{ background: `${rue.couleur}12`, border: `1.5px solid ${rue.couleur}25` }}
        >
          <p
            className="text-[10px] font-black uppercase tracking-wider mb-4"
            style={{ color: rue.couleur }}
          >
            Bientôt disponible
          </p>
          <div className="space-y-3">
            {rue.apercu.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-bold opacity-90">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onRetour}
          className="opacity-60 hover:opacity-100 transition-opacity text-sm font-bold flex items-center gap-2 mx-auto"
        >
          ← Retour à la Rue Principale
        </button>
      </motion.div>
    </div>
  );
}
