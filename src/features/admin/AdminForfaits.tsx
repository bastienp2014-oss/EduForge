import { useState } from 'react';
import { Save, Plus, Trash2, Eye, Crown, RefreshCw, Check } from 'lucide-react';
import { usePlansConfig, savePlansConfig, DEFAULT_PLANS_CONFIG } from '../../services/plansConfig';
import type { PlansConfig } from '../../services/plansConfig';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useTenant } from '../../store/useTenant';

export default function AdminForfaits() {
  const { theme } = useAdminTheme();
  const { currentTenant } = useTenant();
  const { config: configFirestore, isLoading } = usePlansConfig();
  const [config, setConfig] = useState<PlansConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [newAvantage, setNewAvantage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Initialise l'édition depuis Firestore dès que chargé
  const workingConfig = config ?? configFirestore;
  const plan = workingConfig?.premium;

  const updatePlan = (key: string, value: any) => {
    if (!workingConfig) return;
    setConfig({
      ...workingConfig,
      premium: { ...workingConfig.premium, [key]: value },
    });
  };

  const addAvantage = () => {
    if (!plan) return;
    if (!newAvantage.trim()) return;
    updatePlan('avantages', [...plan.avantages, newAvantage.trim()]);
    setNewAvantage('');
  };

  const removeAvantage = (index: number) => {
    if (!plan) return;
    const next = [...plan.avantages];
    next.splice(index, 1);
    updatePlan('avantages', next);
  };

  const updateAvantage = (index: number, value: string) => {
    if (!plan) return;
    const next = [...plan.avantages];
    next[index] = value;
    updatePlan('avantages', next);
  };

  const handleSave = async () => {
    if (!workingConfig) return;
    setIsSaving(true);
    try {
      await savePlansConfig(workingConfig, currentTenant?.id);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      alert('Erreur de sauvegarde. Vérifiez votre connexion.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Réinitialiser aux valeurs par défaut ?')) {
      setConfig(DEFAULT_PLANS_CONFIG);
    }
  };

  if (isLoading || !plan) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ color: theme.colors.ink }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5" style={{ color: theme.colors.primary }} />
          <h2 className="font-black" style={{ color: theme.colors.ink }}>Plan Premium</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors hover:opacity-80"
            style={{ 
              color: theme.colors.primary, 
              backgroundColor: `color-mix(in srgb, ${theme.colors.primary} 15%, transparent)`
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            Aperçu
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors hover:opacity-90`}
            style={{
              backgroundColor: savedOk ? theme.colors.success : theme.colors.ink,
              color: theme.colors.surface
            }}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : savedOk ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {savedOk ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* ── Aperçu Paywall ── */}
      {showPreview && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.header, color: theme.colors.surface }}>
          <div className="text-center mb-4">
            <div className="text-3xl mb-1">{plan.emoji}</div>
            <h3 className="font-black text-lg">Mots & Blocs {plan.nom}</h3>
            <p className="text-xs mt-1" style={{ color: `color-mix(in srgb, ${theme.colors.surface} 70%, transparent)` }}>Aperçu du Paywall</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Mensuel', prix: `${plan.prix_mensuel}$` },
              { label: 'Annuel', prix: `${plan.prix_annuel}$` },
              { label: 'À vie', prix: `${plan.prix_lifetime}$` },
            ].map(({ label, prix }) => (
              <div key={label} className="rounded-xl p-2 text-center" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.surface} 10%, transparent)` }}>
                <p className="text-xs" style={{ color: `color-mix(in srgb, ${theme.colors.surface} 70%, transparent)` }}>{label}</p>
                <p className="font-black text-sm">{prix} {plan.devise}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {plan.avantages.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{ color: `color-mix(in srgb, ${theme.colors.surface} 80%, transparent)` }}>
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: theme.colors.primary }} />
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Identité ── */}
      <div className="rounded-2xl border shadow-sm p-4 space-y-4" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.colors.muted }}>Identité</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: theme.colors.muted }}>Nom du plan</label>
            <input
              type="text"
              value={plan.nom}
              onChange={e => updatePlan('nom', e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none"
              style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: theme.colors.muted }}>Emoji</label>
            <input
              type="text"
              value={plan.emoji}
              onChange={e => updatePlan('emoji', e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm font-bold text-center text-2xl outline-none"
              style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
            />
          </div>
        </div>
      </div>

      {/* ── Prix ── */}
      <div className="rounded-2xl border shadow-sm p-4 space-y-4" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.colors.muted }}>Prix</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'prix_mensuel', label: '💳 Mensuel' },
            { key: 'prix_annuel', label: '📅 Annuel' },
            { key: 'prix_lifetime', label: '🏆 À vie' },
            { key: 'essai_jours', label: '🎁 Essai (jours)' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium mb-1 block" style={{ color: theme.colors.muted }}>{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(plan as any)[key]}
                  onChange={e => updatePlan(key, parseFloat(e.target.value) || 0)}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm font-bold outline-none"
                  style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
                />
                <span className="text-xs shrink-0" style={{ color: theme.colors.muted }}>
                  {key === 'essai_jours' ? 'j' : plan.devise}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Économie annuel calculée */}
        <div className="rounded-xl p-3" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.primary} 10%, transparent)` }}>
          <p className="text-xs font-medium" style={{ color: theme.colors.primary }}>
            💡 Économie annuel vs mensuel :{' '}
            <span className="font-black">
              {Math.round((1 - (plan.prix_annuel / ((plan.prix_mensuel || 1) * 12))) * 100)}%
            </span>
            {' '}— affiché automatiquement sur le Paywall
          </p>
        </div>
      </div>

      {/* ── Limites gratuit ── */}
      <div className="rounded-2xl border shadow-sm p-4 space-y-4" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.colors.muted }}>Limites plan gratuit</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'srs_items_par_jour_gratuit', label: '🧠 SRS items/jour' },
            { key: 'quiz_par_jour_gratuit', label: '❓ Quiz/jour' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium mb-1 block" style={{ color: theme.colors.muted }}>{label}</label>
              <input
                type="number"
                min="1"
                max="50"
                value={(plan as any)[key]}
                onChange={e => updatePlan(key, parseInt(e.target.value) || 5)}
                className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none"
                style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Avantages ── */}
      <div className="rounded-2xl border shadow-sm p-4 space-y-3" style={{ backgroundColor: theme.colors.surface, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)` }}>
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: theme.colors.muted }}>Avantages Premium</h3>
        {plan.avantages.map((avantage, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.colors.primary }} />
            <input
              type="text"
              value={avantage}
              onChange={e => updateAvantage(i, e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
            />
            <button
              onClick={() => removeAvantage(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.danger} 10%, transparent)`, color: theme.colors.danger }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {/* Ajouter un avantage */}
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)` }}>
          <input
            type="text"
            value={newAvantage}
            onChange={e => setNewAvantage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAvantage()}
            placeholder="Nouvel avantage..."
            className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: theme.colors.bg, borderColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)`, color: theme.colors.ink }}
          />
          <button
            onClick={addAvantage}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.surface }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.danger} 5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.danger} 20%, transparent)` }}>
        <h3 className="text-sm font-black mb-2" style={{ color: theme.colors.danger }}>Zone de danger</h3>
        <button
          onClick={handleReset}
          className="text-xs font-bold underline transition-opacity hover:opacity-80"
          style={{ color: theme.colors.danger }}
        >
          Réinitialiser aux valeurs par défaut
        </button>
      </div>

      {/* ── Bouton sauvegarde bas ── */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        style={{ backgroundColor: theme.colors.ink, color: theme.colors.surface }}
      >
        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {savedOk ? '✅ Sauvegardé dans Firestore !' : 'Sauvegarder les forfaits'}
      </button>
      <p className="text-xs text-center" style={{ color: theme.colors.muted }}>
        Les changements sont visibles immédiatement pour tous les utilisateurs.
      </p>
    </div>
  );
}
