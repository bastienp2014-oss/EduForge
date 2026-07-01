import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';
import { useSrs } from '../../store/useSrs';
import { useProgression } from '../../store/useProgression';
import { contentProvider } from '../../services/contentProvider';
import { useTheme } from '../../store/useTheme';

interface DashboardMemorielScreenProps {
  onBack: () => void;
}

export default function DashboardMemorielScreen({ onBack }: DashboardMemorielScreenProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { cards } = useSrs();
  const niveau = useProgression((state) => state.getNiveau());

  const { solides, fragiles, nonTestes } = useMemo(() => {
    const allItems = contentProvider.getItemsByNiveau(niveau);
    const now = new Date();

    const solides: any[] = [];
    const fragiles: any[] = [];
    const nonTestes: any[] = [];

    allItems.forEach((item) => {
      const card = cards[item.id];
      if (!card || card.state === 0) {
        nonTestes.push(item);
        return;
      }

      const due = new Date(card.due);
      // FSRS States: 0=New, 1=Learning, 2=Review, 3=Relearning
      // Si la carte est due ou en apprentissage/réapprentissage -> Fragile
      if (due <= now || card.state === 1 || card.state === 3 || card.stability < 3) {
        fragiles.push({ item, card });
      } else {
        solides.push({ item, card });
      }
    });

    // Tri par stabilité décroissante pour solides, et croissante pour fragiles
    solides.sort((a, b) => b.card.stability - a.card.stability);
    fragiles.sort((a, b) => a.card.stability - b.card.stability);

    return { solides, fragiles, nonTestes };
  }, [cards, niveau]);

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: theme.colors.bg }}>
      <div className="w-full max-w-2xl min-h-screen shadow-xl border-x flex flex-col" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
        
        {/* Header */}
        <div className="sticky top-0 backdrop-blur-md border-b z-50 p-4 flex items-center justify-between" style={{ backgroundColor: `${theme.colors.surface}E6`, borderColor: 'var(--color-border)' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors font-medium"
            style={{ color: theme.colors.muted }}
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          
          <div className="flex items-center gap-2 font-bold px-4 py-2 rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
            <Brain className="w-5 h-5" />
            État Mémoriel
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: theme.colors.ink }}>Votre Mémoire</h1>
            <p style={{ color: theme.colors.muted }}>
              Transparence totale sur la rétention de vos apprentissages. Identifiez ce qui est solide et ce qui nécessite de l'attention.
            </p>
          </div>

          <div className="space-y-8">
            {/* Section Fragiles */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.danger}20`, color: theme.colors.danger }}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display" style={{ color: theme.colors.ink }}>Concepts Fragiles</h2>
                  <p className="text-sm" style={{ color: theme.colors.muted }}>Risque d'oubli élevé. Répétition recommandée.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {fragiles.length > 0 ? fragiles.map(({ item, card }) => (
                  <div key={item.id} className="p-4 rounded-xl border flex justify-between items-center" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)' }}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium" style={{ color: theme.colors.ink }}>{item.payload?.answer || item.id}</span>
                      {card.is_blocked && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block w-max" style={{ backgroundColor: theme.colors.danger, color: '#fff' }}>
                          Incompris (Bloqué)
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: `${theme.colors.danger}10`, color: theme.colors.danger }}>
                      Stabilité: {card.stability.toFixed(1)}j
                    </span>
                  </div>
                )) : (
                  <p className="text-sm italic" style={{ color: theme.colors.muted }}>Aucun concept fragile pour le moment.</p>
                )}
              </div>
            </section>

            {/* Section Solides */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success }}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display" style={{ color: theme.colors.ink }}>Concepts Solides</h2>
                  <p className="text-sm" style={{ color: theme.colors.muted }}>Rétention prolongée et ancrée dans la mémoire.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {solides.length > 0 ? solides.map(({ item, card }) => (
                  <div key={item.id} className="p-4 rounded-xl border flex justify-between items-center" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)' }}>
                    <span className="font-medium" style={{ color: theme.colors.ink }}>{item.payload?.answer || item.payload?.question || item.id}</span>
                    <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: `${theme.colors.success}10`, color: theme.colors.success }}>
                      Stabilité: {card.stability.toFixed(1)}j
                    </span>
                  </div>
                )) : (
                  <p className="text-sm italic" style={{ color: theme.colors.muted }}>Continuez à réviser pour consolider vos concepts.</p>
                )}
              </div>
            </section>

            {/* Section Non Testés */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.colors.muted}20`, color: theme.colors.muted }}>
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display" style={{ color: theme.colors.ink }}>Concepts Non Testés</h2>
                  <p className="text-sm" style={{ color: theme.colors.muted }}>À découvrir lors de vos prochaines sessions.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {nonTestes.length > 0 ? nonTestes.map((item) => (
                  <div key={item.id} className="px-3 py-1.5 text-sm rounded-full border" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)', color: theme.colors.muted }}>
                    {item.payload?.answer || item.id}
                  </div>
                )) : (
                  <p className="text-sm italic" style={{ color: theme.colors.muted }}>Vous avez vu tous les concepts de ce niveau !</p>
                )}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
