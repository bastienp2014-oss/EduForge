import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Globe, Sparkles, Layout, BookOpen, Gamepad2, Save, ExternalLink, Loader2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
export default function AdminWebsite() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const isDark = theme.dark;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [siteConfig, setSiteConfig] = useState({
    heroTitle: 'Maîtrisez le Québécois avec notre application',
    heroSubtitle: 'Apprenez les expressions, les sacres et la culture québécoise de manière ludique et interactive.',
    features: [
      { id: 1, title: 'Apprentissage Ludique', description: 'Des mini-jeux pour retenir le vocabulaire rapidement.' },
      { id: 2, title: 'Reconnaissance Vocale', description: 'Pratiquez votre accent avec notre IA intégrée.' },
      { id: 3, title: 'Contenu Authentique', description: 'Créé par des natifs pour une immersion totale.' },
    ],
    seoLessons: ['les-sacres-de-base', 'commander-au-restaurant', 'expressions-hivernales'],
    teasers: [
      { id: 'memory-match', enabled: true, timeLimit: 120 },
      { id: 'swipe', enabled: true, timeLimit: 60 },
    ]
  });

  useEffect(() => {
    const fetchConfig = async () => {
      if (!currentTenant?.id) return;
      try {
        const docRef = doc(db, 'tenants', currentTenant.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.marketing) {
            setSiteConfig(prev => ({
              ...prev,
              heroTitle: data.marketing.heroTitle || prev.heroTitle,
              heroSubtitle: data.marketing.heroSubtitle || prev.heroSubtitle,
              features: data.marketing.features || prev.features,
              seoLessons: data.marketing.seoLessons || prev.seoLessons,
              teasers: data.marketing.teasers || prev.teasers,
            }));
          }
        }
      } catch (e) {
        console.error("Failed to load tenant website config from Firestore", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [currentTenant?.id]);

  const handleSave = async () => {
    if (!currentTenant?.id) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'tenants', currentTenant.id);
      
      // Get existing document to merge, avoiding overwriting other fields (like theme)
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};

      await setDoc(docRef, {
        ...existingData,
        marketing: {
          ...(existingData.marketing || {}),
          heroTitle: siteConfig.heroTitle,
          heroSubtitle: siteConfig.heroSubtitle,
          features: siteConfig.features,
          seoLessons: siteConfig.seoLessons,
          teasers: siteConfig.teasers,
        },
        id: currentTenant.id,
        name: currentTenant.name,
        domain: currentTenant.id // using ID as domain fallback for now
      }, { merge: true });
      
      alert('Configuration du site vitrine sauvegardée avec succès !');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  };

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    color: theme.colors.ink
  };

  const inputStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1',
    color: theme.colors.ink
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black mb-2" style={{ color: theme.colors.ink }}>Générateur de Site Vitrine (Astro)</h2>
          <p className="text-sm" style={{ color: theme.colors.muted }}>
            Configurez la page d'atterrissage (Landing Page) et la stratégie de contenu public pour l'acquisition de nouveaux utilisateurs.
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Sauvegarder
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Contenu Marketing */}
        <div className="lg:col-span-2 rounded-3xl p-6 shadow-sm border space-y-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}><Layout className="w-6 h-6" /></div>
              <h3 className="text-lg font-black" style={{ color: theme.colors.ink }}>Contenu de la Landing Page</h3>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-bold rounded-lg transition-colors">
              <Sparkles className="w-4 h-4" />
              Générer avec l'IA
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.ink }}>Titre Principal (H1)</label>
            <input 
              type="text" 
              value={siteConfig.heroTitle}
              onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
              className="w-full px-4 py-3 border rounded-xl outline-none transition-colors" 
              style={inputStyle} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.ink }}>Sous-titre</label>
            <textarea 
              value={siteConfig.heroSubtitle}
              onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
              className="w-full px-4 py-3 border rounded-xl outline-none transition-colors h-24" 
              style={inputStyle} 
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-4" style={{ color: theme.colors.ink }}>Arguments Clés (Features)</label>
            <div className="space-y-3">
              {siteConfig.features.map((feature, index) => (
                <div key={feature.id} className="p-4 rounded-xl border flex flex-col gap-2" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff' }}>
                  <input 
                    type="text" 
                    value={feature.title}
                    onChange={(e) => {
                      const newFeatures = [...siteConfig.features];
                      newFeatures[index].title = e.target.value;
                      setSiteConfig({...siteConfig, features: newFeatures});
                    }}
                    className="font-bold bg-transparent border-none outline-none"
                    style={{ color: theme.colors.ink }}
                  />
                  <input 
                    type="text" 
                    value={feature.description}
                    onChange={(e) => {
                      const newFeatures = [...siteConfig.features];
                      newFeatures[index].description = e.target.value;
                      setSiteConfig({...siteConfig, features: newFeatures});
                    }}
                    className="text-sm bg-transparent border-none outline-none"
                    style={{ color: theme.colors.muted }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEO & Teasers */}
        <div className="space-y-6">
          
          <div className="rounded-3xl p-6 shadow-sm border" style={cardStyle}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.success}15`, color: theme.colors.success }}><BookOpen className="w-6 h-6" /></div>
              <h3 className="text-lg font-black" style={{ color: theme.colors.ink }}>SEO Pédagogique</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: theme.colors.muted }}>
              Sélectionnez les leçons à exposer publiquement pour générer du trafic organique.
            </p>
            <div className="space-y-2">
              {['Les sacres de base', 'Commander au restaurant', 'Expressions hivernales', 'Le tutoiement'].map((lesson, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' }}>
                  <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" defaultChecked={i < 3} />
                  <span className="font-medium text-sm">{lesson}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-6 shadow-sm border" style={cardStyle}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.gold}15`, color: theme.colors.gold }}><Gamepad2 className="w-6 h-6" /></div>
              <h3 className="text-lg font-black" style={{ color: theme.colors.ink }}>Teasers Jouables</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: theme.colors.muted }}>
              Intégrez des mini-jeux React dans votre site Astro avec un paywall ou un formulaire après une certaine durée d'essai.
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-xl border" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Memory Match</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.muted }}>
                  <span>Limite d'essai :</span>
                  <input type="number" defaultValue={120} className="w-16 px-2 py-1 rounded border outline-none text-center" style={inputStyle} />
                  <span>secondes</span>
                </div>
              </div>
              
              <div className="p-3 rounded-xl border" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">Swipe Binaire</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.muted }}>
                  <span>Limite d'essai :</span>
                  <input type="number" defaultValue={60} className="w-16 px-2 py-1 rounded border outline-none text-center" style={inputStyle} />
                  <span>secondes</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mockups UI Dynamiques */}
          <div className="rounded-3xl p-6 shadow-sm border" style={cardStyle}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}><Layout className="w-6 h-6" /></div>
              <h3 className="text-lg font-black" style={{ color: theme.colors.ink }}>Mockups UI Dynamiques</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: theme.colors.muted }}>
              Sélectionnez les écrans de l'application à injecter visuellement (sans interaction) dans la section présentation du site vitrine Astro.
            </p>
            <div className="space-y-2">
              {[
                { id: 'timeline', label: 'Parcours d\'apprentissage (Timeline)' },
                { id: 'lecon', label: 'Vue d\'une leçon théorique' },
                { id: 'stats', label: 'Statistiques et progression' }
              ].map((mockup, i) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' }}>
                  <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" defaultChecked={i < 2} />
                  <span className="font-medium text-sm">{mockup.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Action section */}
          <div className="rounded-3xl p-6 shadow-sm border flex flex-col items-center justify-center text-center gap-4" style={{ ...cardStyle, borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}05` }}>
             <div className="p-4 rounded-full bg-blue-100 text-blue-600">
               <ExternalLink className="w-8 h-8" />
             </div>
             <div>
               <h3 className="font-black text-lg mb-1" style={{ color: theme.colors.ink }}>Prévisualiser le site</h3>
               <p className="text-xs" style={{ color: theme.colors.muted }}>Ouvrir le rendu Astro Island avec les teasers et mockups dynamiques.</p>
             </div>
             <button 
               onClick={() => navigate && navigate('/marketing-preview')}
               className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-colors w-full"
             >
               Lancer l'aperçu
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
