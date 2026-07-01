/**
 * PAYWALL MODAL — Mots & Blocs
 *
 * ─────────────────────────────────────────────────────────────────
 * Modal contextuelle légère — apparaît inline quand l'utilisateur
 * tente d'accéder à une fonctionnalité Premium.
 *
 * Usage :
 * <PaywallModal
 *   trigger="simulateur_saaq"
 *   message="Ce simulateur pourrait t'éviter 150–250$ d'échecs"
 *   onOpenPaywall={() => navigateTo('paywall')}
 *   onClose={() => setShowPaywall(false)}
 * />
 *
 * ─────────────────────────────────────────────────────────────────
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ChevronRight } from 'lucide-react';
import { analytics } from '../../services/analytics';

interface PaywallModalProps {
  trigger: string;
  message: string;
  onOpenPaywall: () => void;
  onClose: () => void;
}

export default function PaywallModal({
  trigger,
  message,
  onOpenPaywall,
  onClose,
}: PaywallModalProps) {
  const handleOpen = () => {
    analytics.paywallViewed(trigger);
    onOpenPaywall();
  };

  const handleClose = () => {
    analytics.paywallDismissed(trigger);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4 pb-8"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <h2 className="text-xl font-black text-slate-900 mb-2">
            Fonctionnalité Premium 👑
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* CTA */}
          <button
            onClick={handleOpen}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20 mb-3"
          >
            Voir les offres
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleClose}
            className="w-full text-slate-400 text-sm py-2 hover:text-slate-600 transition-colors"
          >
            Pas maintenant
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
