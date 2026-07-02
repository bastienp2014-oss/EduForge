import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useProgression } from '../../store/useProgression';
import { useTenant } from '../../store/useTenant';
import type { Scenario } from './scenarioEngine';
import ScenarioPlayer from './ScenarioPlayer';
import PaywallModal from '../paywall/PaywallModal';
import { ArrowLeft, Lock, CheckCircle2, RotateCcw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
export default function ScenarioHubScreen({ rueId, onBack}: { rueId: string; onBack: () => void; }) {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('toutes');

  const subscriptionPlan = useProgression(s => s.subscriptionPlan);
  const getNiveau = useProgression(s => s.getNiveau);
  const scenariosCompletes = useProgression(s => s.scenariosCompletes);
  const completerScenario = useProgression(s => s.completerScenario);
  const { currentTenant } = useTenant();
  const userLevel = getNiveau();
  const planRequisMap: Record<string, number> = { 'free': 0, 'basic': 1, 'premium': 2 };
  const userPlanLevel = planRequisMap[subscriptionPlan] || 0;

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const tenantId = currentTenant?.id || 'eduforge';
        const q = query(
          collection(db, 'tenants', tenantId, 'scenarios'),
          where('statut', '==', 'active')
        );
        const snap = await getDocs(q);
        const allScenarios = snap.docs.map(d => d.data() as Scenario);
        setScenarios(allScenarios.filter(s => s.rue_id === rueId));
      } catch (err) {
        console.error("Error fetching scenarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScenarios();
  }, [rueId, currentTenant?.id]);

  const categories = ['toutes', ...Array.from(new Set<string>(scenarios.map(s => s.categorie || 'logement')))];

  const filteredScenarios = scenarios.filter(s => {
    // Category match
    if (selectedCategory !== 'toutes' && (s.categorie || 'logement') !== selectedCategory) return false;
    
    // Premium visibility rule: invisible for free users
    if (s.planRequis === 'premium' && subscriptionPlan === 'free') return false;

    return true;
  });


  const handleScenarioClick = (s: Scenario) => {
    const sPlanLevel = planRequisMap[s.planRequis || 'free'] || 0;
    if (sPlanLevel > userPlanLevel) {
      setShowPaywall(true);
      return;
    }
    
    // Check level lock
    if ((s.niveauMin || 0) > userLevel) {
      alert(`Niveau ${s.niveauMin} requis pour jouer à ce scénario.`);
      return;
    }

    const isCompleted = !!scenariosCompletes[s.id];
    if (isCompleted && !s.repetable) {
      // Cannot replay
      return;
    }

    setActiveScenario(s);
  };

  const handleComplete = (outcome: any, piasses: number, xp: number) => {
    if (activeScenario) {
      if (xp > 0 || piasses > 0) {
        useProgression.getState().claimReward('scenario_complete', { xp, piasses });
      }
      
      completerScenario(activeScenario.id, outcome.type);
    }
    setActiveScenario(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex items-center p-4 bg-white border-b border-slate-200">
        <button onClick={onBack} className="p-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-slate-800">Scénarios</h1>
      </div>

      <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
              selectedCategory === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c === 'toutes' ? 'Toutes' : (c as string).charAt(0).toUpperCase() + (c as string).slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 py-10">Chargement des scénarios...</div>
        ) : filteredScenarios.length > 0 ? (
          filteredScenarios.map(s => {
            const isCompleted = !!scenariosCompletes[s.id];
            const sPlanLevel = planRequisMap[s.planRequis || 'free'] || 0;
            const isLockedPlan = sPlanLevel > userPlanLevel;
            const isLockedLevel = (s.niveauMin || 0) > userLevel;
            const isPlayable = (!isCompleted || s.repetable) && !isLockedPlan && !isLockedLevel;

            return (
              <div 
                key={s.id} 
                onClick={() => handleScenarioClick(s)}
                className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                  isPlayable ? 'border-indigo-100 hover:border-indigo-300 shadow-sm cursor-pointer hover:shadow-md' : 'border-slate-100 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight flex-1 pr-4">{s.titre}</h3>
                  {isLockedPlan ? (
                    <div className="bg-amber-100 text-amber-700 p-2 rounded-full">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : isCompleted ? (
                    s.repetable ? (
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )
                  ) : (
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full">
                      <Play className="w-4 h-4" />
                    </div>
                  )}
                </div>
                
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{s.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">
                    {s.categorie || 'logement'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${isLockedLevel ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    Niv. {s.niveauMin || 0}
                  </span>
                  {s.planRequis && s.planRequis !== 'free' && (
                    <span className="text-xs font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-md capitalize">
                      {s.planRequis}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                      Complété {scenariosCompletes[s.id].outcome === 'succes' ? '⭐' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-slate-500 py-10">Aucun scénario dans cette catégorie.</div>
        )}
      </div>

      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 bg-white"
          >
            <ScenarioPlayer
              scenario={activeScenario}
              onComplete={handleComplete}
              compact={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaywall && (
          <PaywallModal
            trigger="scenarios"
            message="Accède à tous les scénarios et débloque le mode Premium."
            onOpenPaywall={() => {
              setShowPaywall(false);
              if (navigate) navigate('/');
            }}
            onClose={() => setShowPaywall(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
