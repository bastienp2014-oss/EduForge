import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, BookA, Volume2, Lock } from 'lucide-react';
import AudioPlayer from '../../components/AudioPlayer';
import motsData from '../../data/mots.json';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';

type DictionnaireProps = {
  onBack: () => void;
};

export default function DictionnaireScreen({ onBack }: DictionnaireProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const { theme } = useTheme();
  const flags = useProgression().getFeatureFlags();

  const themes = useMemo(() => {
    const allThemes = motsData.map(m => m.theme);
    return Array.from(new Set(allThemes)).filter(Boolean).sort();
  }, []);

  const filteredMots = useMemo(() => {
    return motsData.filter(mot => {
      const matchSearch = searchTerm === '' || 
        mot.mot.toLowerCase().includes(searchTerm.toLowerCase()) || 
        mot.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTheme = selectedTheme === null || mot.theme === selectedTheme;
      
      return matchSearch && matchTheme;
    }).sort((a, b) => a.mot.localeCompare(b.mot));
  }, [searchTerm, selectedTheme]);

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-12 overflow-y-auto w-full font-sans relative" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
      <div className="w-full max-w-[600px] px-6 mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-3 shadow-sm border flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
          style={{ backgroundColor: theme.colors.surface, color: theme.colors.ink, borderColor: 'var(--color-border)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-[600px] px-6">
        <div className="bg-indigo-600 rounded-[2rem] p-6 shadow-lg text-white mb-6 flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-2xl shrink-0">
            <BookA className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight leading-none mb-2">Le Grand Dico</h1>
            <p className="text-indigo-100 text-[13px] leading-relaxed">
              Explore les mots, expressions et particularités du français québécois.
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="p-4 rounded-3xl shadow-sm border mb-6 space-y-4" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.colors.muted }} />
            <input 
              type="text" 
              placeholder="Rechercher un mot ou une définition..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-2xl py-3 pl-12 pr-4 outline-none transition-all font-medium"
              style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)', color: theme.colors.ink }}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedTheme(null)}
              className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors"
              style={selectedTheme === null ? { backgroundColor: theme.colors.primary, color: theme.colors.surface } : { backgroundColor: theme.colors.bg, color: theme.colors.muted }}
            >
              Tous
            </button>
            {themes.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTheme(t)}
                className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors"
                style={selectedTheme === t ? { backgroundColor: theme.colors.primary, color: theme.colors.surface } : { backgroundColor: theme.colors.bg, color: theme.colors.muted }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredMots.length === 0 ? (
            <div className="text-center py-12 font-medium" style={{ color: theme.colors.muted }}>
              Aucun mot trouvé.
            </div>
          ) : (
            filteredMots.map(mot => (
              <div key={mot.id} className="p-5 rounded-3xl shadow-sm border transition-all hover:shadow-md group" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-xl" style={{ color: theme.colors.ink }}>{mot.mot}</h3>
                      {'audioUrl' in mot && (mot as any).audioUrl && flags.feature_audio && (
                        <AudioPlayer
                          text={mot.mot}
                          audioUrl={(mot as any).audioUrl}
                          compact={true}
                          showSpeedControl={false}
                        />
                      )}
                    </div>
                    {mot.theme && (
                      <span className="inline-block mt-1 text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-md" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                        {mot.theme}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 mt-3">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.colors.muted }}>Définition</h4>
                    <p className="text-sm leading-relaxed" style={{ color: theme.colors.ink }}>{mot.definition}</p>
                  </div>
                  
                  {mot.exemple && (
                    <div className="p-3 rounded-2xl border" style={{ backgroundColor: theme.colors.bg, borderColor: 'var(--color-border)' }}>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.colors.muted }}>Exemple</h4>
                      <p className="text-sm italic" style={{ color: theme.colors.ink }}>« {mot.exemple} »</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
