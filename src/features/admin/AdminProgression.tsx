import { auth } from '../../services/firebase';
import React, { useState, useEffect } from 'react';
import { useProgression, ProgressionConfig, NiveauConfig, PointsConfig } from '../../store/useProgression';
import { 
  Award, Trophy, Star, Settings, Save, Plus, Trash2, 
  Sparkles, ShieldAlert, BadgeInfo, HelpCircle, ChevronDown, ChevronUp,
  Upload, Wand2, Loader2, Image as ImageIcon
} from 'lucide-react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useCurrency } from '../../hooks/useCurrency';

const DEFAULT_POINTS_COEFFS: PointsConfig = {
  quizCorrect: 1.25,
  swipeCorrect: 0.50,
  routineBase: 2,
  blocsCorrect: 0.25,
  sortCorrect: 1,
  hacheCorrect: 5,
  tuCorrect: 5,
  contractionsCorrect: 5,
  tutoiementCorrect: 5,
  game2048Correct: 2.25
};

export default function AdminProgression() {
  const { theme } = useAdminTheme();
  const c = theme.colors;
  const piasses = useProgression(s => s.piasses);
  const addPiasses = useProgression(s => s.addPiasses);
  const depenserPiasses = useProgression(s => s.depenserPiasses);
  const motsDebloques = useProgression(s => s.motsDebloques);
  const surnom = useProgression(s => s.surnom);
  const setSurnom = useProgression(s => s.setSurnom);
  const progressionConfig = useProgression(s => s.progressionConfig);
  const updateProgressionConfig = useProgression(s => s.updateProgressionConfig);
  const subscriptionPlan = useProgression(s => s.subscriptionPlan);
  const setSubscriptionPlan = useProgression(s => s.setSubscriptionPlan);
  
  const { format, name: currencyName } = useCurrency();
  const [newSurnom, setNewSurnom] = useState(surnom);
  const [configEnEdition, setConfigEnEdition] = useState<ProgressionConfig>(progressionConfig);
  const [expandedNiveauId, setExpandedNiveauId] = useState<number | null>(1);
  const [showTesterSession, setShowTesterSession] = useState(false);
  const isDark = theme.dark;
  const [isGeneratingBadge, setIsGeneratingBadge] = useState<number | null>(null);
  const [badgePrompts, setBadgePrompts] = useState<Record<number, string>>({});

  const generateBadgeAI = async (niveauIndex: number, niveauNom: string) => {
    const prompt = badgePrompts[niveauIndex];
    if (!prompt) {
      alert("Veuillez entrer une description pour le badge.");
      return;
    }
    
    setIsGeneratingBadge(niveauIndex);
    try {
      const contextualPrompt = `Un badge d'accomplissement de niveau nommé "${niveauNom}". Style emblème, rond ou bouclier, icône centrale vectorielle, fond plat ou dégradé très propre. Pas de texte. Le badge symbolise la progression.`;
      const globalStyle = theme.visualStyle?.description ? `STYLE VISUEL GLOBAL À RESPECTER: ${theme.visualStyle.description}` : '';
      const aiPrompt = `Génère une image de badge 2D. Description: ${prompt}. Contexte: ${contextualPrompt} Utilise ces couleurs (Palette de l'app): ${theme.colors.primary}, ${theme.colors.accent}, ${theme.colors.bg}. ${globalStyle}`;
      
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          aspectRatio: "1:1"
        })
      });

      if (!response.ok) throw new Error("Erreur de l'API");
      const data = await response.json();
      if (data.image) {
        updateNiveauField(niveauIndex, 'badgeImage', data.image);
      }
    } catch (error) {
      console.error(error);
      alert("Échec de la génération du badge.");
    } finally {
      setIsGeneratingBadge(null);
    }
  };

  const resizeAndCompressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        } else {
          reject(new Error("Failed to get canvas context"));
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, niveauIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64Str = await resizeAndCompressImage(file, 512, 512);
      updateNiveauField(niveauIndex, 'badgeImage', base64Str);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du traitement de l\'image.');
    }
  };

  useEffect(() => {
    setConfigEnEdition(progressionConfig);
  }, [progressionConfig]);

  // Handle saving configurations with auto-sorting and ID resequencing
  const handleSaveConfig = () => {
    // Sort levels by threshold ascending to make sure Duolingo-like scan works perfectly
    const levelsCopy = [...configEnEdition.niveaux];
    levelsCopy.sort((a, b) => a.seuilScore - b.seuilScore);
    
    // Resequence IDs: 1, 2, 3... based on sorted threshold sequence
    const sortedAndResequenced = levelsCopy.map((nivel, idx) => ({
      ...nivel,
      id: idx + 1
    }));

    const finalConfig: ProgressionConfig = {
      ...configEnEdition,
      niveaux: sortedAndResequenced
    };

    updateProgressionConfig(finalConfig);
    setConfigEnEdition(finalConfig);
    alert('Les lois de progression ont été réorganisées, triées par XP et sauvegardées avec succès !');
  };

  const updateNiveauField = (index: number, champ: keyof NiveauConfig, valeur: any) => {
    const nouveauxNiveaux = [...configEnEdition.niveaux];
    nouveauxNiveaux[index] = { ...nouveauxNiveaux[index], [champ]: valeur };
    setConfigEnEdition({ ...configEnEdition, niveaux: nouveauxNiveaux });
  };

  const updatePointsField = (index: number, key: keyof PointsConfig, value: number) => {
    const nouveauxNiveaux = [...configEnEdition.niveaux];
    nouveauxNiveaux[index] = { 
      ...nouveauxNiveaux[index], 
      points: { ...nouveauxNiveaux[index].points, [key]: value } 
    };
    setConfigEnEdition({ ...configEnEdition, niveaux: nouveauxNiveaux });
  };

  const handleAddNiveau = () => {
    // Determine last threshold to guess next logical threshold
    const currentMaxThreshold = configEnEdition.niveaux.reduce((max, n) => Math.max(max, n.seuilScore), 0);
    const newThreshold = currentMaxThreshold + 1000;
    const newLevelId = Math.max(...configEnEdition.niveaux.map(n => n.id), 0) + 1;

    const newNiveau: NiveauConfig = {
      id: newLevelId,
      nom: `Nouveau Palier ${newLevelId}`,
      seuilScore: newThreshold,
      points: { ...DEFAULT_POINTS_COEFFS }
    };

    const nextNiveaux = [...configEnEdition.niveaux, newNiveau];
    setConfigEnEdition({ ...configEnEdition, niveaux: nextNiveaux });
    setExpandedNiveauId(newLevelId);
  };

  const handleDeleteNiveau = (indexToDelete: number, levelId: number) => {
    if (configEnEdition.niveaux.length <= 1) {
      alert("Vous devez conserver au moins un niveau de base.");
      return;
    }
    if (confirm(`Voulez-vous vraiment supprimer le Niveau ${levelId} ? La progression se réajustera automatiquement.`)) {
      const nextNiveaux = configEnEdition.niveaux.filter((_, idx) => idx !== indexToDelete);
      setConfigEnEdition({ ...configEnEdition, niveaux: nextNiveaux });
      if (expandedNiveauId === levelId) {
        setExpandedNiveauId(nextNiveaux[0]?.id || null);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto pb-24" style={{ color: c.ink }}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl border shadow-sm gap-4" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600 animate-pulse" style={{ color: c.primary }} />
            Lois de Progression & Curriculum
          </h2>
          <p className="text-xs mt-1" style={{ color: c.muted }}>
            Définissez les paliers d'apprentissage de l'app (Seuils d'XP) et modulez la rémunération en monnaie virtuelle pour chaque activité.
          </p>
        </div>
        <button
          onClick={handleSaveConfig}
          className="px-5 py-3 text-white rounded-xl flex items-center gap-2 font-black shadow-md hover:opacity-90 active:scale-95 transition-all text-xs w-full sm:w-auto justify-center"
          style={{ backgroundColor: c.primary }}
        >
          <Save className="w-4 h-4" /> Enregistrer la structure
        </button>
      </div>

      {/* INFO BANNER */}
      <div className="p-4 rounded-xl border bg-blue-50/10 flex gap-3 text-xs leading-relaxed" style={{ borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe', color: c.ink }}>
        <BadgeInfo className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Comment fonctionne la progression globale ?</p>
          <p style={{ color: c.muted }}>
            Les apprenants accumulent des points d'XP en réalisant des activités (Quiz, Swipe, Pendu, 2048, etc.).
            Dès que leur XP total atteint le <strong>Seuil XP Requis</strong> d'un palier, ils franchissent automatiquement ce palier et accèdent aux contenus ou quartiers verrouillés de la Ville.
            Chaque niveau configure ses propres coefficients de gain financier, permettant une gratification de plus en plus généreuse à mesure que l'apprenant s'élève !
          </p>
        </div>
      </div>

      {/* ── ROADMAP VISUEL DE LA PROGRESSION ── */}
      <div className="p-5 rounded-2xl border shadow-sm space-y-3.5" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: c.muted }}>
          <Star size={14} className="text-amber-500" />
          Carte Globale des Niveaux (Représentation Graphique)
        </h3>
        <p className="text-[11px]" style={{ color: c.muted }}>Cliquez sur l'un des jalons pour déplier instantanément ses réglages de coefficients et son seuil d'accès d'expérience.</p>
        
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {configEnEdition.niveaux.map((nivel, idx) => {
            const isSelected = expandedNiveauId === nivel.id;
            const isLast = idx === configEnEdition.niveaux.length - 1;
            return (
              <React.Fragment key={nivel.id}>
                <div 
                  onClick={() => setExpandedNiveauId(nivel.id)} 
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border cursor-pointer hover:scale-105 active:scale-95 transition-all" 
                  style={{
                    backgroundColor: isSelected ? `${c.primary}15` : isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    borderColor: isSelected ? c.primary : isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1'
                  }}
                >
                  {nivel.badgeImage ? (
                    <img src={nivel.badgeImage} alt="Badge" className="w-6 h-6 object-contain drop-shadow-md" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ backgroundColor: c.primary }}>
                      {idx + 1}
                    </div>
                  )}
                  <div className="text-left shrink-0">
                    <p className="font-black text-xs" style={{ color: c.ink }}>{nivel.nom}</p>
                    <p className="text-[10px] font-semibold" style={{ color: c.muted }}>{nivel.seuilScore} XP</p>
                  </div>
                </div>
                {!isLast && (
                  <span className="text-slate-400 font-bold shrink-0 mx-0.5">➔</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* LEVELS CONFIGURATOR LIST */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-xs uppercase tracking-wider" style={{ color: c.muted }}>Formulaires de configuration des Niveaux ({configEnEdition.niveaux.length})</h3>
          <button
            onClick={handleAddNiveau}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all hover:scale-105"
            style={{ 
              backgroundColor: `${c.success}15`, 
              color: c.success,
              borderColor: `${c.success}40`
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter un palier XP
          </button>
        </div>

        <div className="space-y-3">
          {configEnEdition.niveaux.map((niveau, index) => {
            const isExpanded = expandedNiveauId === niveau.id;
            return (
              <div 
                key={niveau.id} 
                className="border rounded-xl overflow-hidden transition-all shadow-sm"
                style={{ 
                  backgroundColor: c.surface,
                  borderColor: isExpanded ? c.primary : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  boxShadow: isExpanded ? `0 0 12px ${c.primary}15` : 'none'
                }}
              >
                {/* Level Card Header */}
                <div 
                  onClick={() => setExpandedNiveauId(isExpanded ? null : niveau.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors hover:bg-black/5"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}
                >
                  <div className="flex items-center gap-3">
                    {niveau.badgeImage ? (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img src={niveau.badgeImage} alt="Badge" className="w-8 h-8 object-contain drop-shadow-md" />
                      </div>
                    ) : (
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-sm" style={{ backgroundColor: c.primary }}>
                        {index + 1}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2" style={{ color: c.ink }}>
                        {niveau.nom || 'Sans nom'}
                        <span className="text-[10px] font-mono font-normal" style={{ color: c.muted }}>(ID: {niveau.id})</span>
                      </div>
                      <div className="text-xs font-medium" style={{ color: c.muted }}>
                        Débloqué à partir de <strong className="font-semibold" style={{ color: c.ink }}>{niveau.seuilScore} XP</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteNiveau(index, niveau.id)}
                      className="p-2 text-red-600 rounded-lg transition-colors hover:bg-rose-500/10"
                      title="Supprimer ce niveau"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div style={{ color: c.muted }} className="p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Level Card expanded content */}
                {isExpanded && (
                  <div className="p-4 border-t space-y-4 text-xs" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase mb-1" style={{ color: c.muted }}>Nom public du niveau</label>
                        <input
                          type="text"
                          value={niveau.nom}
                          onChange={(e) => updateNiveauField(index, 'nom', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-bold outline-none"
                          style={{
                            backgroundColor: c.surface,
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
                            color: c.ink
                          }}
                          placeholder="Ex: Le Jaseur"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase mb-1" style={{ color: c.muted }}>Seuil Score XP Requis</label>
                        <input
                          type="number"
                          value={niveau.seuilScore}
                          onChange={(e) => updateNiveauField(index, 'seuilScore', parseInt(e.target.value) || 0)}
                          className="w-full border rounded-lg px-3 py-2 text-sm font-mono font-bold outline-none"
                          style={{
                            backgroundColor: c.surface,
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
                            color: c.ink
                          }}
                          step="50"
                        />
                        <p className="text-[10px] mt-1" style={{ color: c.muted }}>L'XP minimum qu'un joueur doit avoir accumulé pour atteindre ce palier.</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <h4 className="font-bold text-xs mb-3 flex items-center gap-1" style={{ color: c.ink }}>
                        <Award className="w-3.5 h-3.5 text-purple-500" />
                        Badge Visuel d'Achèvement (Optionnel)
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {niveau.badgeImage && (
                          <div className="w-16 h-16 rounded-xl border flex-shrink-0 flex items-center justify-center overflow-hidden bg-white/50" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1' }}>
                            <img src={niveau.badgeImage} alt="Badge" className="w-full h-full object-contain p-1" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2 w-full">
                          <div className="flex gap-2">
                            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer hover:bg-slate-50/5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1', color: c.ink }}>
                              <Upload className="w-3.5 h-3.5" /> <span className="text-[10px]">Uploader</span>
                              <input type="file" accept="image/jpeg, image/png, image/webp" className="hidden" onChange={(e) => handleFileUpload(e, index)} />
                            </label>
                            
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Description (ex: Une couronne dorée)"
                                value={badgePrompts[index] || ''}
                                onChange={(e) => setBadgePrompts({...badgePrompts, [index]: e.target.value})}
                                className="flex-1 border rounded-lg px-2 py-1 text-[10px] outline-none"
                                style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1', color: c.ink }}
                              />
                              <button 
                                onClick={() => generateBadgeAI(index, niveau.nom)}
                                disabled={isGeneratingBadge === index}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: `${c.accent}20`, color: c.accent }}
                              >
                                {isGeneratingBadge === index ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                <span className="text-[10px]">Générer avec l'IA</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                      <h4 className="font-bold text-xs mb-3 flex items-center gap-1" style={{ color: c.ink }}>
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        Rémunérations par action réussie (Gains en {currencyName})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                        {Object.entries(niveau.points || DEFAULT_POINTS_COEFFS).map(([key, value]) => {
                          const prettyKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace('Correct', '')
                            .replace('Base', '')
                            .trim();
                          
                          return (
                            <div key={key} className="space-y-1">
                              <label className="block text-[10px] font-medium capitalize leading-tight" style={{ color: c.muted }}>
                                {prettyKey}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.05"
                                  value={value}
                                  onChange={(e) => updatePointsField(index, key as keyof PointsConfig, parseFloat(e.target.value) || 0)}
                                  className="w-full border rounded px-2 py-1 font-bold outline-none text-xs"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1',
                                    color: c.ink
                                  }}
                                />
                                <span className="text-[10px] font-semibold" style={{ color: c.muted }}>$</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SANDBOX SIMULATOR SECTION (VISUALLY ISOLATED AND COLLAPSIBLE TO REORGANIZE) ── */}
      <div className="rounded-2xl border" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
        
        {/* Toggle simulation section */}
        <div 
          onClick={() => setShowTesterSession(!showTesterSession)}
          className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/5"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-500" />
            <div className="text-left">
              <h3 className="font-black text-sm flex items-center gap-2" style={{ color: c.ink }}>
                🧪 Console de Simulation Locale (Session de Test d'Essai)
              </h3>
              <p className="text-[11px]" style={{ color: c.muted }}>
                Déployez vos configurations et simulez un compte d'élève test directement sur votre navigateur pour valider les lois de progression.
              </p>
            </div>
          </div>
          <div style={{ color: c.muted }}>
            {showTesterSession ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {showTesterSession && (
          <div className="p-5 border-t space-y-5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0', backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: c.muted }}>
              <strong>Pourquoi cette section ?</strong> Ce panneau de contrôle sert de bac à sable pour l'administrateur. Les actions ci-dessous n'affectent que votre <strong>session de test locale</strong> actuelle et vous permettent de simuler le comportement d'un élève sans devoir jouer des heures !
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Virtual Wallet simulation */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                <div className="space-y-1">
                  <h4 className="font-bold flex items-center gap-1.5" style={{ color: c.ink }}>
                    <Star className="w-4 h-4 text-amber-500" />
                    Solde d'Essai du Joueur
                  </h4>
                  <p className="text-[10px]" style={{ color: c.muted }}>Ajustez vos "Piasses" pour tester la boutique de la Ville.</p>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <span className="font-medium" style={{ color: c.muted }}>Monnaie :</span>
                  <span className="font-mono font-black" style={{ color: c.success }}>{format(piasses)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => addPiasses(1000)}
                    className="font-bold py-1.5 rounded-lg border text-[10px] hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: c.success, borderColor: `${c.success}30` }}
                  >
                    + 1 000 $
                  </button>
                  <button 
                    onClick={() => depenserPiasses(piasses)}
                    className="font-bold py-1.5 rounded-lg border text-[10px] hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: c.danger, borderColor: `${c.danger}30` }}
                  >
                    Vider
                  </button>
                </div>
              </div>

              {/* Test nickname simulator */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                <div className="space-y-1">
                  <h4 className="font-bold flex items-center gap-1.5" style={{ color: c.ink }}>
                    <HelpCircle className="w-4 h-4 text-blue-500" />
                    Pseudonyme d'Essai
                  </h4>
                  <p className="text-[10px]" style={{ color: c.muted }}>Simulez un autre profil d'apprenant.</p>
                </div>
                <input 
                  value={newSurnom}
                  onChange={(e) => setNewSurnom(e.target.value)}
                  className="w-full border rounded-lg px-2.5 py-1.5 text-xs outline-none"
                  style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1', color: c.ink }}
                  placeholder="Nouveau surnom..."
                />
                <button 
                  onClick={() => {
                    setSurnom(newSurnom);
                    alert(`Pseudonyme joueur mis à jour : "${newSurnom}"`);
                  }}
                  className="w-full py-1.5 text-white rounded-lg font-bold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: c.primary }}
                >
                  Sauvegarder Surnom
                </button>
              </div>

              {/* Feature flags & premium override */}
              <div className="p-4 rounded-xl border flex flex-col justify-between space-y-3" style={{ backgroundColor: c.surface, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }}>
                <div className="space-y-1">
                  <h4 className="font-bold flex items-center gap-1.5" style={{ color: c.ink }}>
                    <ShieldAlert className="w-4 h-4 text-purple-500" />
                    Simuler un Abonnement
                  </h4>
                  <p className="text-[10px]" style={{ color: c.muted }}>Basculez entre les types d'abonnements d'essai.</p>
                </div>
                <select
                  value={subscriptionPlan}
                  onChange={(e) => {
                    const plan = e.target.value as 'free' | 'basic' | 'premium';
                    setSubscriptionPlan(plan);
                    alert(`Plan de test joueur mis sur : "${plan.toUpperCase()}"`);
                  }}
                  className="w-full p-1.5 rounded-lg border outline-none font-bold"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1', color: c.ink }}
                >
                  <option value="free">Free (Limites gratuites actives)</option>
                  <option value="basic">Basic (Débloque l'audio)</option>
                  <option value="premium">Premium (Tout illimité débloqué)</option>
                </select>
                <p className="text-[9px]" style={{ color: c.muted }}>
                  Permet de simuler instantanément ce qu'un client verrait selon son niveau d'abonnement.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
}
