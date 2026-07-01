import React from 'react';
import { ArrowLeft, Home, PackageOpen } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import itemsData from '../../data/items.json';

type AppartementProps = {
  onBack: () => void;
};

export default function AppartementScreen({ onBack }: AppartementProps) {
  const { inventaire } = useProgression();
  const { theme } = useTheme();

  const getInventoryItems = () => {
    return Object.entries(inventaire).map(([id, qte]) => {
      const dbItem = itemsData.find(i => i.id === id);
      return {
        id,
        qte,
        ...dbItem
      };
    }).filter(i => i.nom && i.qte > 0);
  };

  const myItems = getInventoryItems();

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 pb-12 overflow-y-auto w-full h-full" style={{ backgroundColor: theme.colors.bg }}>
      <div className="w-full max-w-[500px] px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-3 shadow flex items-center justify-center rounded-full active:scale-95 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-[500px] px-6">
        <div className="bg-amber-400 rounded-3xl p-6 shadow-xl text-amber-900 mb-8 flex items-center gap-4">
          <div className="bg-white/30 p-4 rounded-full">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Mon Appartement</h1>
            <p className="text-amber-900 mt-1 opacity-90">
              Voici tous les biens que tu as accumulés grâce à ton argent !
            </p>
          </div>
        </div>

        {myItems.length === 0 ? (
          <div className="p-8 rounded-3xl shadow flex flex-col items-center text-center border" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
            <PackageOpen className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.ink }}>Ton appart est vide !</h3>
            <p style={{ color: theme.colors.muted }}>
              Va faire un tour au dépanneur pour commencer à remplir tes armoires et ton frigo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {myItems.map(item => (
              <div key={item.id} className="p-4 rounded-2xl shadow-sm border flex flex-col items-center text-center relative overflow-hidden" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                <div className="absolute top-2 right-2 font-black text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                  x{item.qte}
                </div>
                <div className="text-5xl mb-3 mt-2">
                  {item.icone}
                </div>
                <h3 className="font-bold leading-tight mb-1" style={{ color: theme.colors.ink }}>{item.nom}</h3>
                <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: theme.colors.bg, color: theme.colors.muted }}>
                  {item.categorie}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
