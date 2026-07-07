import React, { useState } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useAppConfig, CurrencyConfig, FeatureFlags } from '../../store/useAppConfig';
import { Settings, ShieldAlert, Coins, ToggleLeft, Globe } from 'lucide-react';
import { useTenant } from '../../store/useTenant';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminConfiguration() {
  const { theme } = useAdminTheme();
  const c = theme.colors;
  const { appName, setAppName, currency, setCurrency, features, setFeatures, srsConfig, setSrsConfig, isLoaded } = useAppConfig();
  const { currentTenant } = useTenant();
  const [domainInput, setDomainInput] = useState(currentTenant?.domain || '');
  const [isSavingDomain, setIsSavingDomain] = useState(false);

  const handleUpdateCurrency = (key: keyof CurrencyConfig, value: string) => {
    setCurrency({ [key]: value });
  };

  const handleToggleFeature = (key: keyof FeatureFlags) => {
    setFeatures({ [key]: !features[key] });
  };

  const handleSaveDomain = async () => {
    if (!currentTenant?.id) return;
    setIsSavingDomain(true);
    try {
      const docRef = doc(db, 'tenants', currentTenant.id);
      await setDoc(docRef, { domain: domainInput.toLowerCase().trim() }, { merge: true });
      alert('Nom de domaine enregistré avec succès. Note: La configuration DNS peut prendre jusqu\'à 24h.');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'enregistrement du domaine');
    } finally {
      setIsSavingDomain(false);
    }
  };

  const CURRENCY_PRESETS = [
    { name: 'Piasses', symbol: '$', position: 'suffix' },
    { name: 'Étoiles', symbol: '⭐', position: 'suffix' },
    { name: 'Points', symbol: 'pts', position: 'suffix' },
    { name: 'Gemmes', symbol: '💎', position: 'prefix' },
    { name: 'Sirop', symbol: '🍁', position: 'suffix' },
    { name: 'Lingots', symbol: '💰', position: 'suffix' },
  ];

  if (!isLoaded) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto pb-24" style={{ color: c.ink }}>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ background: c.primary, color: c.surface }} className="p-2 rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h2 style={{ color: c.ink }} className="text-2xl font-bold">
            Configuration (Marque Blanche)
          </h2>
          <p className="text-sm" style={{ color: c.muted }}>
            Paramètres spécifiques à cette instance de l'application (Locataire).
          </p>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
            <Globe size={20} style={{ color: c.muted }} />
            Domaine Personnalisé
          </h3>
          <p className="text-sm" style={{ color: c.muted }}>
            Définissez le nom de domaine sur lequel cette plateforme sera accessible (ex: <code>app.mon-ecole.com</code>).
            Assurez-vous de configurer un enregistrement CNAME pointant vers <code>notre-serveur.com</code>.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ex: app.mon-ecole.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              className="flex-1 border rounded-xl px-4 py-2 outline-none font-mono"
              style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
            />
            <button
              onClick={handleSaveDomain}
              disabled={isSavingDomain}
              className="px-6 py-2 rounded-xl font-bold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: c.primary, color: c.surface }}
            >
              {isSavingDomain ? 'Enregistrement...' : 'Associer'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
            <Settings size={20} style={{ color: c.muted }} />
            Général
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Nom de l'application</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full border rounded-xl px-4 py-2 outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
            <Coins size={20} style={{ color: c.muted }} />
            Devise Dynamique
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {CURRENCY_PRESETS.map((preset, idx) => {
               const isActive = currency.name === preset.name && currency.symbol === preset.symbol;
               return (
                 <button
                    key={idx}
                    onClick={() => setCurrency(preset as any)}
                    className="p-4 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ 
                      borderColor: isActive ? c.primary : `color-mix(in srgb, ${c.ink} 10%, transparent)`,
                      backgroundColor: isActive ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : c.bg,
                      color: isActive ? c.primary : c.ink,
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                 >
                    <span className="text-2xl">{preset.symbol}</span>
                    <span>{preset.name}</span>
                 </button>
               )
             })}
          </div>

          <div className="pt-4 border-t space-y-4" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
            <h4 className="font-bold text-sm" style={{ color: c.ink }}>Configuration personnalisée</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: c.muted }}>Nom de la devise</label>
                <input
                  type="text"
                  value={currency.name}
                  onChange={(e) => handleUpdateCurrency('name', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: c.muted }}>Symbole</label>
                <input
                  type="text"
                  value={currency.symbol}
                  onChange={(e) => handleUpdateCurrency('symbol', e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: c.muted }}>Position</label>
                <select
                  value={currency.position}
                  onChange={(e) => handleUpdateCurrency('position', e.target.value as 'prefix'|'suffix')}
                  className="w-full border rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                >
                  <option value="prefix">Prefixe ({currency.symbol}100)</option>
                  <option value="suffix">Suffixe (100{currency.symbol})</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-1">
             <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
               <Settings size={20} style={{ color: c.muted }} />
               Configuration de Révision (SRS)
             </h3>
             <p className="text-sm" style={{ color: c.muted }}>
               Ajustez le nombre d'éléments demandés par défaut dans les sessions quotidiennes et la quantité maximale de nouveaux éléments.
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Maximum d'éléments par session</label>
              <input
                type="number"
                min={1}
                value={srsConfig.maxDailyItems}
                onChange={(e) => setSrsConfig({ maxDailyItems: parseInt(e.target.value) || 15 })}
                className="w-full border rounded-xl px-4 py-2 outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1" style={{ color: c.ink }}>Maximum de nouveaux éléments</label>
              <input
                type="number"
                min={1}
                value={srsConfig.maxNewItems}
                onChange={(e) => setSrsConfig({ maxNewItems: parseInt(e.target.value) || 5 })}
                className="w-full border rounded-xl px-4 py-2 outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-1">
             <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
               <ToggleLeft size={20} style={{ color: c.muted }} />
               Feature Flags (Marque Blanche)
             </h3>
             <p className="text-sm" style={{ color: c.muted }}>
               Activez ou désactivez des modules pour cette instance de l'application.
             </p>
          </div>

          <div className="space-y-3">
             {[
               { key: 'enableQuebecTaxes', label: 'Taxes du Québec', desc: 'Applique le calcul TPS/TVQ dans la boutique (Dépanneur).' },
               { key: 'enableAiGenerator', label: 'Assistant IA', desc: 'Active le chat et les fonctionnalités de l\'assistant Gemini.' },
               { key: 'enableGameGenerator', label: 'Générateur de mini-jeux', desc: 'Permet à l\'utilisateur de créer de nouveaux jeux par IA.' },
               { key: 'enableStore', label: 'Boutique / Dépanneur', desc: 'Active le module d\'achat d\'objets avec la monnaie virtuelle.' },
             ].map((f) => (
                <div key={f.key} className="flex items-center justify-between p-4 border rounded-xl" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)`, backgroundColor: c.bg }}>
                   <div>
                     <p className="font-bold text-sm" style={{ color: c.ink }}>{f.label}</p>
                     <p className="text-xs mt-1" style={{ color: c.muted }}>{f.desc}</p>
                   </div>
                   <button 
                     onClick={() => handleToggleFeature(f.key as keyof FeatureFlags)}
                     className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all`}
                     style={{ 
                       borderColor: features[f.key as keyof FeatureFlags] ? c.primary : `color-mix(in srgb, ${c.ink} 15%, transparent)`,
                       backgroundColor: features[f.key as keyof FeatureFlags] ? `color-mix(in srgb, ${c.primary} 10%, transparent)` : 'transparent',
                       color: features[f.key as keyof FeatureFlags] ? c.primary : c.ink
                     }}
                   >
                     {features[f.key as keyof FeatureFlags] ? 'Activé' : 'Désactivé'}
                   </button>
                </div>
             ))}
          </div>
        </div>
      </div>

    </div>
  );
}
