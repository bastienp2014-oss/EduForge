import React, { useState } from 'react';
import { ArrowLeft, Check, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, PREDEFINED_THEMES } from '../../store/useTheme';

interface ApparenceScreenProps {
  onBack: () => void;
}

export default function ApparenceScreen({ onBack }: ApparenceScreenProps) {
  const { theme, activeThemeId, setThemeById } = useTheme();
  
  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative font-sans" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-xl transition-colors hover:bg-black/5" style={{ color: theme.colors.muted }}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black font-display tracking-tight leading-none" style={{ color: theme.colors.ink }}>Apparence</h1>
            <p className="text-sm font-medium mt-1" style={{ color: theme.colors.muted }}>Personnalisez l'esthétique du jeu</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Thèmes prédéfinis */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 font-mono" style={{ color: theme.colors.muted }}>Thèmes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PREDEFINED_THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setThemeById(t.id)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all relative overflow-hidden group"
                  style={{ 
                    backgroundColor: t.colors.surface, 
                    borderColor: activeThemeId === t.id ? t.colors.primary : `${t.colors.muted}40` 
                  }}
                >
                  {/* Miniature du thème */}
                  <div className="w-full aspect-video rounded-xl flex shadow-sm border border-black/5" style={{ backgroundColor: t.colors.bg }}>
                    <div className="w-1/3 h-full rounded-l-xl opacity-80" style={{ backgroundColor: t.colors.header }}></div>
                    <div className="flex-1 p-2 flex flex-col gap-2 justify-center items-center">
                       <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: t.colors.primary }}></div>
                       <div className="w-12 h-2 rounded-full opacity-50" style={{ backgroundColor: t.colors.ink }}></div>
                    </div>
                  </div>
                  
                  <span className="text-sm font-bold font-display" style={{ color: t.colors.ink }}>{t.name}</span>
                  
                  {activeThemeId === t.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: t.colors.primary, color: '#fff' }}>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Configuration du thème personnel (à venir) */}
          <section className="p-6 rounded-3xl border-2" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
            <h2 className="text-lg font-black font-display mb-2" style={{ color: theme.colors.ink }}>Thème Personnel</h2>
            <p className="text-sm font-medium mb-4" style={{ color: theme.colors.muted }}>Bientôt disponible. Vous pourrez créer votre propre palette de couleurs.</p>
            <div className="h-12 w-full rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${theme.colors.muted}20`, color: theme.colors.muted }}>
              En construction
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
