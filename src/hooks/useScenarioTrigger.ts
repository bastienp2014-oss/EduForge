import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useProgression } from '../store/useProgression';
import type { Scenario } from '../features/scenarios/scenarioEngine';

import { useTenant } from '../store/useTenant';

export const useScenarioTrigger = (rueId: string) => {
  const [triggerScenario, setTriggerScenario] = useState<Scenario | null>(null);
  
  useEffect(() => {
    const fetchScenarios = async () => {
      if (!auth.currentUser) return;
      // 1. Load active scenarios for this rue
      const state = useProgression.getState();
      const planRequisMap: Record<string, number> = { 'free': 0, 'basic': 1, 'premium': 2 };
      const userPlanLevel = planRequisMap[state.subscriptionPlan] || 0;
      const userLevel = state.getNiveau();
      const completes = state.scenariosCompletes;

      try {
        const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
        const q = query(
          collection(db, 'tenants', tenantId, 'scenarios'),
          where('statut', '==', 'active')
        );
        const snap = await getDocs(q);
        const scenarios = snap.docs.map(d => d.data() as Scenario);

        // 2. Filter
        const eligible = scenarios.filter(s => {
          if (s.rue_id !== rueId) return false;
          if (s.declencheur !== 'entree_rue') return false;
          if ((s.niveauMin || 0) > userLevel) return false;
          const sPlanLevel = planRequisMap[s.planRequis || 'free'] || 0;
          if (sPlanLevel > userPlanLevel) return false;
          
          const isCompleted = !!completes[s.id];
          if (isCompleted && !s.repetable) return false;

          return true;
        });

        // 3. Return trigger
        if (eligible.length > 0) {
          setTriggerScenario(eligible[0]);
        }
      } catch (err) {
        console.error("Error fetching scenarios for trigger:", err);
      }
    };

    if (rueId) {
      fetchScenarios();
    }
  }, [rueId]);

  return triggerScenario;
};
