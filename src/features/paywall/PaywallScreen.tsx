/**
 * PAYWALL SCREEN — Mots & Blocs
 *
 * ─────────────────────────────────────────────────────────────────
 * Écran de souscription Premium.
 * Prix et avantages chargés depuis Firestore (/configuration/plans_fr_qc).
 * Modifiable sans redéploiement depuis Firebase Console ou AdminScreen.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { ArrowLeft, Check, Zap, Shield, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlansConfig } from '../../services/plansConfig';
import { useProgression } from '../../store/useProgression';
import { analytics } from '../../services/analytics';

// ─── Types ────────────────────────────────────────────────────────

type BillingCycle = 'mensuel' | 'annuel' | 'lifetime';

interface PaywallScreenProps {
  onBack: () => void;
  trigger?: string; // D'où vient l'utilisateur (pour analytics)
}

// ─── Composant principal ──────────────────────────────────────────

export default function PaywallScreen({ onBack, trigger = 'direct' }: PaywallScreenProps) {
  const { config, isLoading } = usePlansConfig();
  const { setSubscriptionPlan, isPremium } = useProgression();
  const [billing, setBilling] = useState<BillingCycle>('annuel');
  const [isActivating, setIsActivating] = useState(false);

  const plan = config.premium;

  // Prix affiché selon le cycle
  const prixAffiche = billing === 'mensuel' 
    ? plan.prix_mensuel 
    : billing === 'annuel'
      ? plan.prix_annuel
      : plan.prix_lifetime;
      
  const prixParMois = billing === 'annuel' 
    ? (plan.prix_annuel / 12).toFixed(2) 
    : null;
    
  const economie = billing === 'annuel' 
    ? Math.round((1 - (plan.prix_annuel / (plan.prix_mensuel * 12))) * 100) 
    : null;

  // ── Activation (amorce RevenueCat Phase 8 complète) ────────────
  const handleActivate = async () => {
    setIsActivating(true);
    // TODO Phase 8 complète : intégrer RevenueCat ici
    // RevenueCat -> webhook -> Cloud Function -> Firestore (isPremium = true côté serveur)
    // Pour l'instant : activation locale pour les tests
    setSubscriptionPlan('premium');
    analytics.subscriptionStarted('premium');
    
    setTimeout(() => {
      setIsActivating(false);
      onBack();
    }, 1000);
  };

  const handleDismiss = () => {
    analytics.paywallDismissed(trigger);
    onBack();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-4 pt-safe">
        <button
          onClick={handleDismiss}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {plan.essai_jours > 0 && (
          <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
            {plan.essai_jours} jours gratuits
          </span>
        )}
      </div>

      {/* ── Hero ── */}
      <div className="text-center px-6 py-6">
        <div className="text-5xl mb-3">{plan.emoji}</div>
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          Mots & Blocs {plan.nom}
        </h1>
        <p className="text-purple-200 text-sm leading-relaxed">
          Maîtrisez les codes invisibles du Québec.{'\n'}
          Protégez votre budget. Accélérez votre intégration.
        </p>
      </div>

      {/* ── ROI Badges ── */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Shield, label: 'Évite 150–250$', sub: "d'échecs SAAQ" },
            { icon: Zap, label: '28% de salaire', sub: 'en plus après 10 ans' },
            { icon: Clock, label: '5 min/jour', sub: 'suffisent' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-white/10 rounded-2xl p-3 text-center">
              <Icon className="w-5 h-5 text-purple-300 mx-auto mb-1" />
              <p className="text-white font-black text-xs leading-tight">{label}</p>
              <p className="text-purple-300 text-[10px] leading-tight mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Avantages ── */}
      <div className="px-6 mb-6">
        <div className="bg-white/5 rounded-2xl p-4 space-y-3">
          {plan.avantages.map((avantage, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-white/90 text-sm leading-snug">{avantage}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Sélecteur de cycle ── */}
      <div className="px-6 mb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { cycle: 'mensuel' as BillingCycle, label: 'Mensuel', prix: `${plan.prix_mensuel}$`, badge: null },
            { cycle: 'annuel' as BillingCycle, label: 'Annuel', prix: `${plan.prix_annuel}$`, badge: economie ? `-${economie}%` : null },
            { cycle: 'lifetime' as BillingCycle, label: 'À vie', prix: `${plan.prix_lifetime}$`, badge: '🏆' },
          ].map(({ cycle, label, prix, badge }) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={`
                relative rounded-2xl p-3 text-center border-2 transition-all
                ${billing === cycle 
                  ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/30' 
                  : 'bg-white/5 border-white/10 hover:border-white/30'
                }
              `}
            >
              {badge && (
                <span className="absolute -top-2 -right-2 text-xs font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              <p className="text-white font-bold text-xs mb-1">{label}</p>
              <p className="text-white font-black text-sm">{prix}</p>
              <p className="text-white/50 text-[10px]">{plan.devise}</p>
            </button>
          ))}
        </div>
        
        {/* Prix par mois si annuel */}
        {billing === 'annuel' && prixParMois && (
          <p className="text-center text-purple-300 text-xs mt-2 font-medium">
            Soit {prixParMois}$ {plan.devise}/mois · Bien moins que Duolingo (119$ US/an)
          </p>
        )}
        {billing === 'lifetime' && (
          <p className="text-center text-purple-300 text-xs mt-2 font-medium">
            Accès permanent · Payez une fois, apprenez pour toujours
          </p>
        )}
        {billing === 'mensuel' && (
          <p className="text-center text-purple-300 text-xs mt-2 font-medium">
            Annulez n'importe quand
          </p>
        )}
      </div>

      {/* ── CTA Principal ── */}
      <div className="px-6 pb-safe mt-auto">
        <button
          onClick={handleActivate}
          disabled={isActivating || isPremium}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black py-5 rounded-2xl text-lg shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {isActivating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPremium ? (
            '✅ Déjà Premium'
          ) : plan.essai_jours > 0 ? (
            <>
              Commencer {plan.essai_jours} jours gratuits
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Débloquer Premium · {prixAffiche}$ {plan.devise}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        
        {plan.essai_jours > 0 && !isPremium && (
          <p className="text-center text-white/40 text-xs mt-3">
            {plan.essai_jours} jours gratuits, puis {
              billing === 'mensuel' ? `${plan.prix_mensuel}$/${plan.devise} par mois`
              : billing === 'annuel' ? `${plan.prix_annuel}$ ${plan.devise}/an`
              : `${plan.prix_lifetime}$ ${plan.devise} une fois`
            } · Annulable avant la fin de l'essai
          </p>
        )}
        
        <button
          onClick={handleDismiss}
          className="w-full text-white/30 text-sm py-4 hover:text-white/50 transition-colors"
        >
          Continuer avec le plan gratuit
        </button>
      </div>
    </div>
  );
}
