import { useState, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Sparkles, Tent, PackageOpen } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import motsData from '../../data/mots.json';
import itemsData from '../../data/items.json';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../store/useTheme';

export default function StoreScreen({ onBack }: { onBack: () => void }) {
  const { inventaire, motsDebloques, echangerObjetContreMot } = useProgression();
  const { theme } = useTheme();
  const [unlockedWord, setUnlockedWord] = useState<typeof motsData[0] | null>(null);
  
  const lockedWords = useMemo(() => {
    return motsData.filter(mot => !motsDebloques.includes(mot.id));
  }, [motsDebloques]);

  const itemsPossedes = useMemo(() => {
    return Object.entries(inventaire)
      .filter(([id, qte]) => qte > 0)
      .map(([id, qte]) => {
        const itemObj = itemsData.find(i => i.id === id);
        return {
          id,
          qte,
          nom: itemObj?.nom || 'Objet inconnu',
          icone: itemObj?.icone || '📦'
        };
      });
  }, [inventaire]);

  const handleEchange = (objetId: string) => {
    if (lockedWords.length === 0) return;

    const randomIndex = Math.floor(Math.random() * lockedWords.length);
    const chosenWord = lockedWords[randomIndex];
    
    const success = echangerObjetContreMot(objetId, chosenWord.id);
    if (success) {
      setUnlockedWord(chosenWord);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8" style={{ backgroundColor: theme.colors.bg }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-4 rounded-2xl shadow-sm border max-w-2xl w-full mx-auto" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
        <button 
          onClick={onBack}
          className="p-2 rounded-full transition-colors flex items-center gap-2 font-medium"
          style={{ color: theme.colors.ink, backgroundColor: `${theme.colors.ink}05` }}
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Retour</span>
        </button>
        
        <div className="font-bold flex items-center gap-2" style={{ color: theme.colors.ink }}>
          <Tent className="w-5 h-5 text-orange-500" />
          Vente de Garage
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ backgroundColor: `${theme.colors.ink}05`, borderColor: 'var(--color-border)', color: theme.colors.ink }}>
          <span className="font-medium text-sm">Découvrir les mots 📖</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-6">
        
        <div className="bg-orange-500 rounded-3xl p-6 shadow-lg text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Le vrai Marché aux Puces</h2>
          <p className="text-orange-100">
            Échange les objets que tu as achetés au dépanneur pour découvrir de nouveaux mots typiquement québécois !
          </p>
        </div>

        {/* Recently Unlocked Word Presentation */}
        <AnimatePresence>
          {unlockedWord && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 shadow-xl border-2 border-yellow-200 text-center relative z-10"
            >
              <div className="text-xs uppercase font-bold text-yellow-600 tracking-widest mb-4 flex justify-center items-center gap-2">
                <Sparkles className="w-4 h-4" /> Nouveau mot découvert ! <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-4xl font-extrabold text-slate-800 mb-4">{unlockedWord.mot}</h3>
              <p className="text-lg text-slate-600 italic mb-6">"{unlockedWord.definition}"</p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                <span className="text-sm font-bold text-slate-400 uppercase">Exemple</span>
                <p className="text-slate-700 mt-1">{unlockedWord.exemple}</p>
              </div>
              
              <button 
                onClick={() => setUnlockedWord(null)}
                className="mt-6 text-slate-500 hover:text-slate-700 font-medium underline"
              >
                Super ! Retour à l'inventaire
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory list */}
        <div className="rounded-3xl p-6 shadow-sm border" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.ink }}>
            <PackageOpen className="w-6 h-6 text-slate-400" /> 
            Mes objets à échanger
          </h3>

          {itemsPossedes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🤷‍♂️</div>
              <p className="font-medium mb-2" style={{ color: theme.colors.muted }}>Ton inventaire est tout vide.</p>
              <p className="text-sm" style={{ color: theme.colors.muted }}>Vas faire tes courses au dépanneur avant de venir faire le troc !</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {itemsPossedes.map(item => (
                <div key={item.id} className="rounded-2xl p-4 flex items-center justify-between border" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl p-2 rounded-xl shadow-sm border" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                      {item.icone}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: theme.colors.ink }}>{item.nom}</div>
                      <div className="text-sm font-medium" style={{ color: theme.colors.muted }}>En stock : {item.qte}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEchange(item.id)}
                    disabled={lockedWords.length === 0}
                    className={`ml-4 px-4 py-2 hover:bg-orange-600 bg-orange-500 text-white font-bold rounded-xl active:scale-95 transition-transform flex flex-col items-center shadow-md ${lockedWords.length === 0 ? 'opacity-50 cursor-not-allowed bg-slate-300 hover:bg-slate-300 text-slate-500' : ''}`}
                  >
                    <span>Échanger</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {lockedWords.length === 0 && (
             <div className="mt-6 text-center text-emerald-600 font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100">
               Tu as débloqué tous les mots du dictionnaire ! Bravo ! 🎉
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
