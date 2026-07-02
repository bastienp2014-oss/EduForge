import React, { useState, useEffect } from 'react';
import { useProgression, ObjectifPrincipal } from '../store/useProgression';
import { Timer, AlertTriangle, ArrowRight, Home, Smartphone, CheckCircle2, ShieldCheck,
Briefcase, MessageCircle, GraduationCap, Users } from 'lucide-react';
import { differenceInDays, addMonths, isPast } from 'date-fns';
import onboardingData from '../data/onboarding.json';
import { analytics, getArrivalBucket } from '../services/analytics';
import ScenarioPlayer from '../features/scenarios/ScenarioPlayer';
import scenariosData from '../data/scenarios.json';
import type { Scenario, Outcome } from '../features/scenarios/scenarioEngine';

type OnboardingStep = 'step1_date' | 'step1_result' | 'step1_lang' | 'step1_pays' | 'step1_localisation' | 'step2_sms' | 'step2_sms_result' | 'step3_timeline' | 'step4_segment';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>('step1_date');
  const [arrivalDate, setArrivalDate] = useState<string>('');
  const [daysRemainingSAAQ, setDaysRemainingSAAQ] = useState<number | null>(null);

  const { setDateArrivee, completeOnboarding, setObjectifPrincipal, setIsFrancophone,
  isFrancophone, objectifPrincipal } = useProgression();

  // Trace chaque changement de step
  useEffect(() => {
    analytics.onboardingStepViewed(step);

    // Le moment AHA : l'écran "BAM / économisé 2000$"
    if (step === 'step2_sms_result') {
      analytics.ahaMomentReached();
    }
  }, [step]);

  const navigateTo = (nextStep: OnboardingStep) => {
    setStep(nextStep);
  };

  const handleDateSubmit = () => {
    if (!arrivalDate) return;

    setDateArrivee(arrivalDate);

    const dateObj = new Date(arrivalDate);
    const now = new Date();

    if (isPast(dateObj)) {
      const saaqDeadline = addMonths(dateObj, 6);
      const days = differenceInDays(saaqDeadline, now);
      setDaysRemainingSAAQ(days);
    } else {
      setDaysRemainingSAAQ(null);
    }

    navigateTo('step1_result');
  };

  const handleFrancophoSet = (value: boolean) => {
    setIsFrancophone(value);
    analytics.isFrancophoSet(value);
    
    if (value && useProgression.getState().piasses < 1000) {
      useProgression.getState().claimReward('onboarding_francophone');
    }
    navigateTo('step1_pays');
  };

  const handleSegmentSelected = (objectif: ObjectifPrincipal) => {
    setObjectifPrincipal(objectif);
    analytics.segmentSelected(objectif);
    finishOnboarding(objectif);
  };

  const finishOnboarding = (objectif: ObjectifPrincipal) => {
    completeOnboarding();
    analytics.onboardingCompleted({
      is_francophone: useProgression.getState().isFrancophone,
      objectif,
      arrival_bucket: getArrivalBucket(arrivalDate || null),
    });
    onComplete();
  };

  const smsProprioScenario = (scenariosData as Scenario[]).find(s => s.id === 'sms_proprio')!;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">

        {step === 'step1_date' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Timer className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Bienvenue au Québec.</h1>
            <p className="text-slate-600 text-center mb-8">Êtes-vous arrivé il y a moins de 6 mois ? Pour le savoir, indiquez votre date d'arrivée exacte.</p>
            
            <input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className="w-full p-4 mb-6 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-lg font-medium text-slate-700"
            />

            <button
              onClick={handleDateSubmit}
              disabled={!arrivalDate}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'step1_result' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-right-8 text-center">
            {daysRemainingSAAQ !== null && daysRemainingSAAQ <= 180 && daysRemainingSAAQ > 0 ? (
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 border-4 border-amber-200">
                  <AlertTriangle className="w-10 h-10 text-amber-600" />
                </div>
                <h1 className="text-2xl font-black text-amber-600 mb-4 tracking-tight">ATTENTION</h1>
                <p className="text-lg font-medium text-slate-800 mb-2">
                  Votre permis de conduire étranger expire dans <span className="text-amber-500 font-black text-2xl">{daysRemainingSAAQ}</span> jours.
                </p>
                <p className="text-slate-600 mb-8">La SAAQ ne pardonne pas. Vous conduirez bientôt dans l'illégalité.</p>
              </>
            ) : daysRemainingSAAQ !== null && daysRemainingSAAQ <= 0 ? (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-black text-red-600 mb-4 tracking-tight">ILLÉGALITÉ</h1>
                <p className="text-lg font-medium text-slate-800 mb-8">
                  Votre délai de 6 mois est écoulé. Si vous conduisez avec votre permis étranger, vous êtes dans l'illégalité face à la SAAQ.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <Home className="w-10 h-10 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-black text-indigo-900 mb-4 tracking-tight">Vous planifiez...</h1>
                <p className="text-lg font-medium text-slate-800 mb-8">
                  Mieux vaut prévenir. Vous avez 6 mois dès votre arrivée pour échanger votre permis de conduire.
                </p>
              </>
            )}

            <button
              onClick={() => navigateTo('step1_lang')}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'step1_lang' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-right-8 bg-white text-center min-h-[500px] justify-center">
            <h1 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Vite demême...</h1>
            <p className="text-slate-600 mb-8 font-medium">Parlez-vous déjà couramment français ?</p>
            
            <div className="space-y-4 w-full">
              <button
                onClick={() => handleFrancophoSet(true)}
                className="w-full p-6 bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <MessageCircle className="w-8 h-8 text-emerald-600" />
                <h3 className="font-bold text-emerald-900 text-lg">Oui !</h3>
                <p className="text-emerald-700 text-sm">France, Afrique, etc. Je veux juste m'adapter au Québec.</p>
              </button>
              
              <button
                onClick={() => handleFrancophoSet(false)}
                className="w-full p-6 bg-amber-50 border-2 border-amber-200 hover:border-amber-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group"
              >
                <GraduationCap className="w-8 h-8 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-lg">Non / Pas encore</h3>
                <p className="text-amber-700 text-sm">Je veux apprendre le français et m'intégrer.</p>
              </button>
            </div>
          </div>
        )}

        {step === 'step1_pays' && (
          <div className="p-6 flex flex-col animate-in fade-in slide-in-from-right-8 h-[500px] justify-center bg-slate-50">
            <h1 className="text-2xl font-black text-slate-800 text-center mb-2">
              D'où venez-vous ?
            </h1>
            <p className="text-slate-500 text-center mb-6 text-sm">
              Pour personnaliser votre expérience
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto w-full">
              {[
                'Maroc', 'France', 'Algérie', 'Tunisie', 'Côte d\'Ivoire',
                'Sénégal', 'Cameroun', 'Haïti', 'Congo', 'Liban',
                'Mexique', 'Colombie', 'Brésil', 'Vietnam', 'Philippines',
                'Chine', 'Inde', 'Pakistan', 'Ukraine', 'Roumanie',
                'Portugal', 'Belgique', 'Suisse', 'Espagne', 'Autre'
              ].map((pays) => (
                <button
                  key={pays}
                  onClick={() => {
                    useProgression.getState().setPaysOrigine(pays);
                    navigateTo('step1_localisation');
                  }}
                  className="p-3 bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-xl font-medium text-slate-700 text-sm transition-all text-left"
                >
                  {pays}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'step1_localisation' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-right-8 min-h-[500px] justify-center bg-slate-50">
            <h1 className="text-2xl font-black text-slate-800 text-center mb-2">
              Où êtes-vous en ce moment ?
            </h1>
            <p className="text-slate-500 text-center mb-8 text-sm">
              Cela nous aide à adapter votre apprentissage
            </p>
            <div className="space-y-3 w-full">
              {[
                { value: 'quebec', label: 'Je suis au Québec', emoji: '🍁' },
                { value: 'canada', label: 'Ailleurs au Canada', emoji: '🇨🇦' },
                { value: 'pas_arrive', label: 'Pas encore arrivé', emoji: '✈️' },
              ].map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => {
                    useProgression.getState().setLocalisationActuelle(
                      value as 'quebec' | 'canada' | 'pas_arrive'
                    );
                    navigateTo('step2_sms');
                  }}
                  className="w-full p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center gap-4 transition-all"
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="font-bold text-slate-800 text-left">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'step2_sms' && smsProprioScenario && (
          <div className="animate-in fade-in slide-in-from-right-8">
            <ScenarioPlayer
              scenario={smsProprioScenario}
              compact
              onComplete={(outcome: Outcome, piasses: number, xp: number) => {
                if (xp > 0 || piasses > 0) {
                  useProgression.getState().claimReward('scenario_complete', { xp, piasses });
                }
                navigateTo('step3_timeline');
              }}
            />
          </div>
        )}

        {step === 'step3_timeline' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-right-8 bg-slate-900 text-white min-h-[500px] justify-center">
            <div className="w-full space-y-6 mb-10">
              <div className="flex items-center gap-4 animate-in slide-in-from-left-4 delay-100">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm">J1</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-700"></div>
                <p className="font-medium text-slate-300 text-sm w-32">Langue de la rue</p>
              </div>
              <div className="flex items-center gap-4 animate-in slide-in-from-left-4 delay-200">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm">J45</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-700"></div>
                <p className="font-medium text-slate-300 text-sm w-32">CV gagnant</p>
              </div>
              <div className="flex items-center gap-4 animate-in slide-in-from-left-4 delay-300">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="font-black text-sm">J90</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-700"></div>
                <p className="font-medium text-slate-300 text-sm w-32">Pièges évités</p>
              </div>
            </div>
            
            <h1 className="text-2xl font-black mb-8 text-center leading-tight">
              Prêt à réussir tes 90 premiers jours ?
            </h1>
            
            <button
              onClick={() => navigateTo('step4_segment')}
              className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/30"
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 'step4_segment' && (
          <div className="p-8 flex flex-col items-center animate-in fade-in slide-in-from-right-8 bg-slate-50 min-h-[500px]">
            <h1 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Pour commencer...</h1>
            <p className="text-slate-600 text-center mb-8 font-medium">Qu'est-ce qui vous stresse le plus en ce moment ?</p>
            
            <div className="space-y-4 w-full">
              {onboardingData.map((option: any) => {
                const IconComponent = {
                  ShieldCheck, Briefcase, MessageCircle, GraduationCap, Users
                }[option.icon as string] || CheckCircle2;
                
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSegmentSelected(option.id as ObjectifPrincipal)}
                    className="w-full p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-2xl flex items-start gap-4 text-left transition-all group"
                  >
                    <div className={`w-12 h-12 bg-${option.color}-100 text-${option.color}-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1">{option.title}</h3>
                      <p className="text-slate-500 text-sm leading-snug">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
