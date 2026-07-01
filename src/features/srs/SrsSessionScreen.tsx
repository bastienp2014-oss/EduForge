import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eye, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AudioPlayer from '../../components/AudioPlayer';
import { useSrs } from '../../store/useSrs';
import { contentProvider } from '../../services/contentProvider';
import { useProgression } from '../../store/useProgression';
import { analytics } from '../../services/analytics';
import { Rating } from '../../services/srs';
import type { ContentItem } from '../../types';

interface SrsSessionScreenProps {
  onBack: () => void;
}

type SessionPhase = 'chargement' | 'question' | 'reponse' | 'recap';

// ─── Badges de module ────────────────────────────────────────────
const MODULE_BADGES: Record<string, { label: string; color: string }> = {
  mots: { label: 'Vocabulaire', color: 'bg-blue-100 text-blue-700' },
  anglicismes: { label: 'Anglicismes', color: 'bg-amber-100 text-amber-700' },
  quiz: { label: 'Quiz culturel', color: 'bg-purple-100 text-purple-700' },
};

// ─── Boutons de rating ────────────────────────────────────────────
const RATING_BUTTONS = [
  { rating: Rating.Again, label: 'Encore', emoji: '🔴', bg: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' },
  { rating: Rating.Hard, label: 'Difficile',emoji: '🟠', bg: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100' },
  { rating: Rating.Good, label: 'Bien', emoji: '🟢', bg: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' },
  { rating: Rating.Easy, label: 'Facile', emoji: '🔵', bg: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
];

export default function SrsSessionScreen({ onBack }: SrsSessionScreenProps) {
  const { sessionItemIds, preparerSession, enregistrerReponse, chargerDepuisFirebase, isLoading } = useSrs();
  const { getNiveau, getPointsConfig } = useProgression();

  const [phase, setPhase] = useState<SessionPhase>('chargement');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [itemsRevises, setItemsRevises] = useState(0);

  // Items résolus avec leur ContentItem pour l'affichage
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [sessionItems, setSessionItems] = useState<ContentItem[]>([]);

  // ── Chargement initial ────────────────────────────────────────
  useEffect(() => {
    analytics.moduleStarted('srs_session');
    chargerDepuisFirebase().then(() => {
      preparerSession();
    });
  }, []);

  // ── Résoudre les items une fois la session prête ──────────────
  useEffect(() => {
    if (sessionItemIds.length === 0) return;

    const niveau = getNiveau();
    const allItems = contentProvider.getItemsByNiveau(niveau);
    const itemMap = Object.fromEntries(allItems.map((i) => [i.id, i]));
    
    const resolved = sessionItemIds
      .map((id) => itemMap[id])
      .filter(Boolean) as ContentItem[];

    if (resolved.length === 0) {
      setPhase('recap');
      return;
    }

    setSessionItems(resolved);
    setCurrentItem(resolved[0]);
    setPhase('question');
  }, [sessionItemIds]);

  // ── Révéler la réponse ────────────────────────────────────────
  const handleVoirReponse = () => {
    setPhase('reponse');
  };

  // ── Enregistrer le rating et passer au suivant ────────────────
  const handleRating = useCallback(async (rating: Rating) => {
    if (!currentItem) return;

    // XP calculé localement pour l'affichage
    const routineBase = getPointsConfig().routineBase;
    const xpGagne = rating === Rating.Again ? 0
      : rating === Rating.Hard ? routineBase * 0.5
      : rating === Rating.Good ? routineBase
      : routineBase * 1.5;

    setXpTotal((prev) => prev + xpGagne);
    setItemsRevises((prev) => prev + 1);

    analytics.answerRecorded({
      module: `srs_${currentItem.module}`,
      correct: rating === Rating.Good || rating === Rating.Easy,
      item_id: currentItem.id,
    });

    // Persistance (async — non bloquant)
    enregistrerReponse(currentItem.id, rating);

    // Prochain item
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sessionItems.length) {
      // Session terminée
      analytics.moduleCompleted('srs_session', itemsRevises + 1);
      setPhase('recap');
    } else {
      setCurrentIndex(nextIndex);
      setCurrentItem(sessionItems[nextIndex]);
      setPhase('question');
    }
  }, [currentItem, currentIndex, sessionItems, getPointsConfig, enregistrerReponse, itemsRevises]);

  // ─── Rendu : chargement ───────────────────────────────────────
  if (phase === 'chargement' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 font-medium">Préparation de ta session…</p>
        </div>
      </div>
    );
  }

  // ─── Rendu : recap ────────────────────────────────────────────
  if (phase === 'recap') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Session terminée !</h1>
          <p className="text-slate-500 mb-8">T'as bien travaillé aujourd'hui.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-3xl font-black text-blue-600">{itemsRevises}</p>
              <p className="text-xs font-medium text-blue-500 mt-1">
                mot{itemsRevises > 1 ? 's' : ''} révisé{itemsRevises > 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-3xl font-black text-amber-600">+{Math.round(xpTotal)}</p>
              <p className="text-xs font-medium text-amber-500 mt-1">XP gagné</p>
            </div>
          </div>

          {itemsRevises === 0 && (
            <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="font-bold text-green-800 text-sm">Rien à réviser !</p>
              </div>
              <p className="text-green-700 text-xs leading-relaxed">
                Tous tes mots sont bien mémorisés. Reviens demain pour de nouvelles révisions.
              </p>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Rendu : question / réponse ───────────────────────────────
  if (!currentItem) return null;

  const badge = MODULE_BADGES[currentItem.module] ?? { label: currentItem.module, color: 'bg-slate-100 text-slate-600' };
  const progress = sessionItems.length > 0 ? (currentIndex / sessionItems.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 p-4 pt-safe">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs font-medium">
              {currentIndex + 1} / {sessionItems.length}
            </span>
            <div className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3 h-3" />
              <span className="text-xs font-bold">+{Math.round(xpTotal)} XP</span>
            </div>
          </div>
          {/* Barre de progression */}
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <motion.div
              className="bg-blue-400 h-1.5 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* ── Carte principale ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id + phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            {/* Badge module */}
            <div className="flex justify-center mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            {/* Carte */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 min-h-[240px] flex flex-col justify-between">
              {/* Question */}
              <div className="text-center">
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">
                  {currentItem.module === 'anglicismes' ? 'Quel est le mot québécois ?' : 'Que signifie…'}
                </p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4">
                  {currentItem.payload.question || currentItem.payload.translation}
                </h2>
                {currentItem.module === 'mots' && (
                  <div className="mt-3">
                    <AudioPlayer
                      text={currentItem.payload.answer || ""}
                      audioUrl={currentItem.payload.audioUrl}
                      compact={true}
                      showSpeedControl={false}
                    />
                  </div>
                )}
              </div>

              {/* Réponse (révélée) */}
              {phase === 'reponse' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-slate-100 pt-4 mt-2"
                >
                  <p className="text-slate-700 font-medium text-sm leading-relaxed mb-2">
                    {currentItem.payload.answer}
                  </p>
                  {currentItem.payload.exemple && (
                    <p className="text-slate-400 text-xs italic leading-relaxed">
                      "{currentItem.payload.exemple}"
                    </p>
                  )}
                </motion.div>
              )}

              {/* Placeholder réponse cachée */}
              {phase === 'question' && (
                <div className="border-t border-dashed border-slate-200 pt-4 mt-2">
                  <div className="h-4 bg-slate-100 rounded-full w-3/4 mx-auto" />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Boutons d'action ── */}
      <div className="p-6 pb-safe">
        {phase === 'question' ? (
          <button
            onClick={handleVoirReponse}
            className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-[0.98]"
          >
            <Eye className="w-5 h-5" />
            Voir la réponse
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {RATING_BUTTONS.map(({ rating, label, emoji, bg }) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                className={`border-2 rounded-xl py-3 px-2 font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.97] ${bg}`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Bouton passer (sans XP) */}
        {phase === 'question' && sessionItems.length > 1 && (
          <button
            onClick={() => handleRating(Rating.Again)}
            className="w-full mt-3 text-white/40 text-xs font-medium py-2 flex items-center justify-center gap-1 hover:text-white/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Passer cet item
          </button>
        )}
      </div>
    </div>
  );
}
