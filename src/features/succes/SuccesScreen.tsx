import React, { useState } from 'react';
import { Trophy, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { BADGES } from '../../data/badges';

export default function SuccesScreen({ onBack }: { onBack: () => void }) {
  const { stats, badgesDeclenches } = useProgression();
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'toutes' | 'arcade' | 'apprentissage' | 'social' | 'special'>('toutes');

  const categories = ['toutes', 'apprentissage', 'arcade', 'social', 'special'] as const;

  const filteredBadges = BADGES.filter(b => activeCategory === 'toutes' || b.categorie === activeCategory);

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 pb-12 overflow-y-auto w-full font-sans" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
      <div className="w-full max-w-[500px] px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-3 shadow-sm flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-[500px] px-6 relative z-10">
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-[2rem] p-6 shadow-2xl text-white mb-8 flex border border-yellow-400 items-center gap-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-8 opacity-20 pointer-events-none">
            <Trophy size={120} />
          </div>
          <div className="bg-white/20 p-4 rounded-2xl shrink-0 backdrop-blur-sm relative z-10">
            <span className="text-3xl">🏅</span>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-black font-display tracking-tight leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-orange-100 drop-shadow-sm">Succès</h1>
            <p className="text-orange-50 text-sm leading-relaxed font-medium">
              Collectionne les insignes en jouant aux différents modules pour montrer ton niveau.
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors shadow-sm border"
              style={activeCategory === cat ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, color: theme.colors.surface } : { backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)', color: theme.colors.muted }}
            >
              {cat === 'toutes' ? 'Global' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBadges.map(badge => {
            const isUnlocked = !!badgesDeclenches[badge.id];
            
            // To show progress, we just take the first condition (assuming mostly 1 condition per badge)
            const primaryCond = badge.conditions[0];
            const currentStat = stats[primaryCond.statId] || 0;
            const progress = Math.min(100, Math.round((currentStat / primaryCond.threshold) * 100));

            return (
              <div 
                key={badge.id}
                className={`rounded-2xl p-5 border-2 relative overflow-hidden transition-all ${
                  isUnlocked ? 'shadow-md' : 'opacity-80'
                }`}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: isUnlocked ? theme.colors.primary : 'var(--color-border)'
                }}
              >
                {/* Visual completion mark */}
                {isUnlocked && (
                  <div className="absolute top-3 right-3" style={{ color: theme.colors.primary }}>
                    <CheckCircle className="w-5 h-5 fill-current opacity-20" />
                  </div>
                )}
                
                <div className={`text-4xl mb-3 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                  {badge.icon}
                </div>
                
                <h3 className="font-black text-lg leading-tight mb-1" style={{ color: isUnlocked ? theme.colors.ink : theme.colors.muted }}>
                  {badge.titre}
                </h3>
                
                <p className="text-xs mb-4 font-medium min-h-[2.5rem]" style={{ color: theme.colors.muted }}>
                  {badge.description}
                </p>

                {isUnlocked ? (
                  <div className="text-[10px] font-bold px-2 py-1 rounded inline-block uppercase tracking-wider" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                    Débloqué
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] font-bold mb-1 font-mono uppercase" style={{ color: theme.colors.muted }}>
                      <span>Progression</span>
                      <span>{currentStat} / {primaryCond.threshold}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.bg }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: theme.colors.primary }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
