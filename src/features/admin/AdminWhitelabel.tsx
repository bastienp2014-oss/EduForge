import React, { useState } from 'react';
import AdminConfiguration from './AdminConfiguration';
import AdminTheme from './AdminTheme';
import { useAdminTheme, ADMIN_THEMES } from '../../store/useAdminTheme';
import { Globe, Palette, Settings, Layout, RotateCcw, Paintbrush, Sparkles, Check } from 'lucide-react';

export default function AdminWhitelabel() {
  const { theme, setTheme, updateCustomColors, resetToDefault } = useAdminTheme();
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'theme' | 'adminTheme'>('config');

  // Core colors list for easy mapping
  const colorLabels: { key: keyof typeof theme.colors; label: string; desc: string }[] = [
    { key: 'primary', label: 'Couleur Primaire', desc: 'Boutons principaux, éléments actifs et accents forts.' },
    { key: 'accent', label: 'Couleur d\'Accent', desc: 'Boutons secondaires et éléments d\'attention.' },
    { key: 'header', label: 'Couleur de l\'En-tête', desc: 'Arrière-plan de la barre supérieure d\'administration.' },
    { key: 'bg', label: 'Fond de page', desc: 'Arrière-plan principal de l\'espace d\'administration.' },
    { key: 'surface', label: 'Surfaces & Cartes', desc: 'Fond des tableaux, formulaires et blocs de contenu.' },
    { key: 'ink', label: 'Couleur du Texte', desc: 'Texte principal et titres.' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink }}>
      <div className="px-6 py-4 border-b flex gap-4 overflow-x-auto scrollbar-hide shrink-0" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <button 
          onClick={() => setActiveSubTab('config')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 text-xs ${activeSubTab === 'config' ? '' : 'opacity-60 hover:opacity-100'}`}
          style={{ backgroundColor: activeSubTab === 'config' ? `${theme.colors.primary}15` : 'transparent', color: activeSubTab === 'config' ? theme.colors.primary : theme.colors.ink }}
        >
          <Settings className="w-4 h-4" />
          Paramètres de l'App
        </button>
        <button 
          onClick={() => setActiveSubTab('theme')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 text-xs ${activeSubTab === 'theme' ? '' : 'opacity-60 hover:opacity-100'}`}
          style={{ backgroundColor: activeSubTab === 'theme' ? `${theme.colors.primary}15` : 'transparent', color: activeSubTab === 'theme' ? theme.colors.primary : theme.colors.ink }}
        >
          <Palette className="w-4 h-4" />
          Thème Apprenants
        </button>
        <button 
          onClick={() => setActiveSubTab('adminTheme')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shrink-0 text-xs ${activeSubTab === 'adminTheme' ? '' : 'opacity-60 hover:opacity-100'}`}
          style={{ backgroundColor: activeSubTab === 'adminTheme' ? `${theme.colors.primary}15` : 'transparent', color: activeSubTab === 'adminTheme' ? theme.colors.primary : theme.colors.ink }}
        >
          <Paintbrush className="w-4 h-4" />
          Thème Espace Admin
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeSubTab === 'config' && <AdminConfiguration />}
        {activeSubTab === 'theme' && <AdminTheme />}
        
        {activeSubTab === 'adminTheme' && (
          <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24">
            
            {/* Header / Info box */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4">
                <Paintbrush size={160} />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                <Sparkles size={11} /> Personnalisation de l'Interface d'Administration
              </span>
              <h3 className="text-xl font-black">Design & Thème de votre Espace Gestionnaire</h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Adaptez les couleurs de l'espace Super-Admin ou de l'espace de création de vos clients whitelabel. Les modifications s'appliquent en temps réel sur toute la console de gestion. Chaque client B2B de votre plateforme peut ainsi avoir un espace de configuration à ses propres couleurs d'école ou d'institution.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-blue-600" />
                Thèmes Prédéfinis pour l'Espace Admin
              </h4>
              <p className="text-xs text-slate-500">Choisissez un thème de départ préconfiguré pour la console admin :</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {Object.entries(ADMIN_THEMES).map(([id, t]: [string, any]) => {
                  const isSelected = theme.id === id;
                  return (
                    <button 
                      key={id}
                      onClick={() => setTheme(t)}
                      className={`text-left rounded-xl p-4 border-2 transition-all relative flex flex-col justify-between h-28 hover:shadow-md ${isSelected ? 'scale-[1.02]' : 'hover:border-slate-300'}`}
                      style={{ 
                        borderColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.08)',
                        backgroundColor: t.colors.surface,
                        color: t.colors.ink
                      }}
                    >
                      <div>
                        <div className="font-black text-xs flex items-center gap-1.5">
                          {t.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" style={{ backgroundColor: theme.colors.primary }} />}
                        </div>
                        <p className="text-[10px] opacity-60 mt-0.5">Style {id === 'admin_dark' ? 'Sombre' : 'Clair'}</p>
                      </div>

                      <div className="flex gap-1.5 mt-4">
                        <span className="w-4 h-4 rounded-full border border-black/5 block" style={{ backgroundColor: t.colors.primary }} />
                        <span className="w-4 h-4 rounded-full border border-black/5 block" style={{ backgroundColor: t.colors.accent }} />
                        <span className="w-4 h-4 rounded-full border border-black/5 block" style={{ backgroundColor: t.colors.bg }} />
                        <span className="w-4 h-4 rounded-full border border-black/5 block" style={{ backgroundColor: t.colors.surface }} />
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 rounded-full p-1 shadow-sm text-white" style={{ backgroundColor: theme.colors.primary }}>
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Palette customization */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    Palette de Couleurs Personnalisée (Sur mesure)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Ajustez finement chaque couleur pour créer un thème d'administration unique.</p>
                </div>

                <button
                  onClick={() => {
                    resetToDefault();
                    alert("Le thème de l'espace d'administration a été réinitialisé avec succès aux couleurs par défaut !");
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold border rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Réinitialiser par défaut
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {colorLabels.map(({ key, label, desc }) => (
                  <div key={key} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-800">{label}</span>
                      <p className="text-[10px] text-slate-500 max-w-xs">{desc}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        value={theme.colors[key]}
                        onChange={(e) => updateCustomColors({ [key]: e.target.value })}
                        className="w-10 h-10 rounded-xl border cursor-pointer shrink-0 bg-white p-0.5 shadow-sm"
                      />
                      <input 
                        type="text"
                        value={theme.colors[key]}
                        onChange={(e) => updateCustomColors({ [key]: e.target.value })}
                        className="w-24 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs uppercase font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs space-y-1 border border-blue-100">
                <span className="font-bold flex items-center gap-1">ℹ️ Sauvegarde locale instantanée</span>
                <p className="opacity-95">Ces réglages sont persistés dans la session de votre navigateur. Pour les déployer définitivement sur l'instance cloud d'un client B2B whitelabel spécifique, associez le thème personnalisé à son profil d'instance depuis le catalogue des forfaits.</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
