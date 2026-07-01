/**
 * SCENARIO PLAYER — Mots & Blocs (Phase 13)
 * Lecteur UI style messagerie (iMessage).
 * Utilisé dans l'Onboarding ET dans les rues thématiques.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { Scenario, Noeud, Choix, Outcome } from './scenarioEngine';
import { getNoeud, isTerminal } from './scenarioEngine';

// ─── Types ────────────────────────────────────────────────────────
type Message = {
  id: string;
  locuteur: string;
  avatar?: string;
  texte: string;
  audioUrl?: string; // Phase 1: audio support
  estChoix?: boolean; // message envoyé par l'utilisateur
};

type Phase = 'affichage' | 'attente' | 'feedback' | 'outcome';

type ScenarioPlayerProps = {
  scenario: Scenario;
  onComplete: (outcome: Outcome, effetsPiasses: number, effetsXp: number) => void;
  compact?: boolean; // version réduite pour l'onboarding
};

// ─── Composant ────────────────────────────────────────────────────
export default function ScenarioPlayer({ scenario, onComplete, compact = false }: ScenarioPlayerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [noeudCourant, setNoeudCourant] = useState<Noeud | null>(null);
  const [phase, setPhase] = useState<Phase>('affichage');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [piassesTotal, setPiassesTotal] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialiser avec le premier nœud
  useEffect(() => {
    const premier = getNoeud(scenario, scenario.noeudInitial);
    if (!premier) return;
    setNoeudCourant(premier);
    setMessages([{ id: `msg-${premier.id}`, locuteur: premier.locuteur, avatar: premier.avatar, texte: premier.texte, audioUrl: premier.audioUrl }]);
    setPhase(isTerminal(premier) ? 'outcome' : 'attente');
    if (premier.outcome) setOutcome(premier.outcome);
  }, [scenario]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, feedback]);

  const handleChoix = (choix: Choix) => {
    if (phase !== 'attente') return;
    
    // Ajouter le message de l'utilisateur
    const msgChoix: Message = { id: `msg-choix-${choix.id}`, locuteur: 'vous', texte: choix.texte, estChoix: true };
    setMessages(prev => [...prev, msgChoix]);
    setPhase('feedback');
    setFeedback(choix.feedback ?? null);

    // Accumuler les effets
    if (choix.effets?.piasses) setPiassesTotal(p => p + (choix.effets?.piasses ?? 0));
    if (choix.effets?.xp) setXpTotal(x => x + (choix.effets?.xp ?? 0));

    // Après 2s, naviguer vers le nœud suivant
    setTimeout(() => {
      setFeedback(null);
      const suivant = getNoeud(scenario, choix.noeudSuivant);
      if (!suivant) return;
      
      setMessages(prev => [...prev, {
        id: `msg-${suivant.id}-${Date.now()}`,
        locuteur: suivant.locuteur,
        avatar: suivant.avatar,
        texte: suivant.texte,
        audioUrl: suivant.audioUrl,
      }]);
      setNoeudCourant(suivant);

      if (isTerminal(suivant)) {
        setOutcome(suivant.outcome ?? null);
        setPhase('outcome');
      } else {
        setPhase('attente');
      }
    }, 2000);
  };

  // ── Écran outcome ───────────────────────────────────────────────
  if (phase === 'outcome' && outcome) {
    const isSucces = outcome.type === 'succes';
    const isEchec = outcome.type === 'echec';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex flex-col items-center justify-center text-center p-8 ${compact ? 'min-h-[420px]' : 'min-h-screen'} ${
          isSucces ? 'bg-indigo-600' : isEchec ? 'bg-red-700' : 'bg-slate-700'
        } text-white`}
      >
        <div className="text-6xl mb-4">{isSucces ? '💥' : isEchec ? '🚨' : '⚖️'}</div>
        <h2 className="text-3xl font-black mb-2">{isSucces ? 'BAM !' : isEchec ? 'Oups !' : 'Voilà !'}</h2>
        <p className="text-lg font-medium mb-4 leading-snug opacity-90 max-w-xs">{outcome.message}</p>
        
        {outcome.sousTitre && (
          <div className="bg-white/15 rounded-2xl px-5 py-3 mb-6 max-w-xs">
            <p className="text-sm font-medium opacity-90">{outcome.sousTitre}</p>
          </div>
        )}

        {outcome.recompense && outcome.recompense > 0 && (
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-lg">⭐</span>
            <span className="font-black">+{outcome.recompense} XP</span>
          </div>
        )}

        <button
          onClick={() => onComplete(outcome, piassesTotal, xpTotal)}
          className="flex items-center gap-2 bg-white text-slate-900 font-black py-4 px-8 rounded-2xl hover:bg-opacity-90 transition-colors"
        >
          Continuer <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  // ── Vue messagerie ──────────────────────────────────────────────
  return (
    <div className={`flex flex-col bg-slate-100 ${compact ? 'h-[500px]' : 'min-h-screen'}`}>
      {/* Header */}
      {!compact && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-xl">
            {noeudCourant?.avatar ?? '👤'}
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">{scenario.titre}</p>
            <p className="text-slate-400 text-xs">{scenario.lieu}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${msg.estChoix ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.estChoix && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-base shrink-0">
                  {msg.avatar ?? '👤'}
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.estChoix
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-100'
                }`}
              >
                {msg.texte}
                {msg.audioUrl && (
                  <div className="mt-2">
                    <audio controls src={msg.audioUrl} className="max-w-full h-8" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Feedback pédagogique */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-2 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm text-amber-800 font-medium"
            >
               💡 {feedback}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Choix */}
      <AnimatePresence>
        {phase === 'attente' && noeudCourant && noeudCourant.choix.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-t border-slate-200 p-3 space-y-2"
          >
            {noeudCourant.choix.map(choix => (
              <button
                key={choix.id}
                onClick={() => handleChoix(choix)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-left transition-all border border-slate-200 text-slate-800 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 active:scale-95"
              >
                {choix.texte}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
