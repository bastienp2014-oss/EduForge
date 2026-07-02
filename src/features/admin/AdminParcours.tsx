import { auth } from '../../services/firebase';
import { secureFetch } from '../../utils/secureFetch';
import React, { useState } from 'react';
import { useProgression, NiveauConfig, ChapitreConfig, LeconConfig, ProgressionConfig } from '../../store/useProgression';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useAppConfig } from '../../store/useAppConfig';
import { useTheme } from '../../store/useTheme';
import { useSettings } from '../../store/useSettings';
import { useSuggestMechanic } from '../../hooks/useSuggestMechanic';
import { 
  Plus, Trash2, Save, ArrowUp, ArrowDown, Sparkles, 
  ChevronDown, ChevronUp, Check, Loader, BookOpen, Gamepad2, Layers, Wand2
} from 'lucide-react';

export default function AdminParcours() {
  const { theme } = useAdminTheme();
  const progressionConfig = useProgression(s => s.progressionConfig);
  const updateProgressionConfig = useProgression(s => s.updateProgressionConfig);
  const addCustomContentItems = useProgression(s => s.addCustomContentItems);
  const { appName, setAppName } = useAppConfig();
  const themeStore = useTheme();
  const { persona, context } = useSettings();

  const [config, setConfig] = useState<ProgressionConfig>(JSON.parse(JSON.stringify(progressionConfig)));
  const [expandedNiveau, setExpandedNiveau] = useState<number | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null);

  // AI Generation states
  const [promptTopic, setPromptTopic] = useState('');
  const [generatingPath, setGeneratingPath] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  const { suggestMechanic, isLoading: isSuggesting } = useSuggestMechanic();
  const [mechanicReasons, setMechanicReasons] = useState<Record<string, string>>({});
  const [suggestingLessonId, setSuggestingLessonId] = useState<string | null>(null);

  const handleSuggestMechanic = async (leconId: string, subject: string, description: string, nIndex: number, cIndex: number, lIndex: number) => {
    setSuggestingLessonId(leconId);
    const result = await suggestMechanic(subject, description || subject);
    if (result) {
      updateLeconField(nIndex, cIndex, lIndex, 'mechanic', result.mechanic);
      setMechanicReasons(prev => ({ ...prev, [leconId]: result.reason }));
    }
    setSuggestingLessonId(null);
  };

  const genererContenuLeconRAG = async (leconId: string, subject: string, nIndex: number, cIndex: number, lIndex: number) => {
    setGeneratingLessonId(leconId);
    try {
      const response = await secureFetch('/api/gemini/generate-lesson-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        },
        body: JSON.stringify({
          courseId: "global",
          subject,
          persona
        })
      });
      if (!response.ok) throw new Error("Erreur génération de leçon");
      const data = await response.json();
      updateLeconField(nIndex, cIndex, lIndex, 'theorieContent', data.lesson);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la leçon via RAG");
    } finally {
      setGeneratingLessonId(null);
    }
  };

  // Save full configuration
  const handleSave = () => {
    updateProgressionConfig(config);
    alert('Parcours sauvegardé avec succès !');
  };

  // Level operations
  const updateNiveauField = (nIndex: number, field: keyof NiveauConfig, value: any) => {
    const newNiveaux = [...config.niveaux];
    newNiveaux[nIndex] = { ...newNiveaux[nIndex], [field]: value };
    setConfig({ ...config, niveaux: newNiveaux });
  };

  // Chapter operations
  const addChapitre = (nIndex: number) => {
    const newNiveaux = [...config.niveaux];
    const niveau = newNiveaux[nIndex];
    if (!niveau.chapitres) niveau.chapitres = [];
    
    niveau.chapitres.push({
      id: `chap_${Date.now()}`,
      nom: 'Nouveau Chapitre',
      description: 'Description du chapitre...',
      lecons: []
    });
    
    setConfig({ ...config, niveaux: newNiveaux });
  };

  const deleteChapitre = (nIndex: number, cIndex: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce chapitre et toutes ses leçons ?')) return;
    const newNiveaux = [...config.niveaux];
    newNiveaux[nIndex].chapitres.splice(cIndex, 1);
    setConfig({ ...config, niveaux: newNiveaux });
  };

  const moveChapitre = (nIndex: number, cIndex: number, direction: 'up' | 'down') => {
    const newNiveaux = [...config.niveaux];
    const chapitres = newNiveaux[nIndex].chapitres;
    const targetIndex = direction === 'up' ? cIndex - 1 : cIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= chapitres.length) return;
    
    const temp = chapitres[cIndex];
    chapitres[cIndex] = chapitres[targetIndex];
    chapitres[targetIndex] = temp;
    
    setConfig({ ...config, niveaux: newNiveaux });
  };

  const updateChapitreField = (nIndex: number, cIndex: number, field: keyof ChapitreConfig, value: any) => {
    const newNiveaux = [...config.niveaux];
    newNiveaux[nIndex].chapitres[cIndex] = { ...newNiveaux[nIndex].chapitres[cIndex], [field]: value };
    setConfig({ ...config, niveaux: newNiveaux });
  };

  // Lesson operations
  const addLecon = (nIndex: number, cIndex: number) => {
    const newNiveaux = [...config.niveaux];
    const lecons = newNiveaux[nIndex].chapitres[cIndex].lecons;
    const newId = `lecon_${Date.now()}`;
    
    lecons.push({
      id: newId,
      nom: 'Nouvelle Leçon',
      type: 'jeu',
      mechanic: 'flashcard',
      tags: ['vocabulaire'],
      contentSource: 'lesson',
      theorieContent: ''
    });
    
    setConfig({ ...config, niveaux: newNiveaux });
    setExpandedLesson(newId);
  };

  const generateLeconAi = async (nIndex: number, cIndex: number) => {
    setAiError(null);
    setAiSuccessMessage(null);
    
    const chapNom = config.niveaux[nIndex].chapitres[cIndex].nom;
    const niveauNom = config.niveaux[nIndex].nom;

    try {
      const prompt = `Génère une leçon québécoise unique (soit théorie, soit jeu) s'insérant dans le chapitre "${chapNom}" du niveau "${niveauNom}".
Tu dois répondre EXCLUSIVEMENT avec un JSON ayant cette structure:
{
  "lecon": {
    "nom": "Nom captivant de la leçon",
    "type": "theorie" | "jeu",
    "mechanic": "flashcard" | "quiz" | "swipe" | "pendu" (Seulement si type=jeu),
    "tags": ["tag_quebecois_approprié"],
    "contentSource": "lesson",
    "theorieContent": "Texte éducatif (Seulement si type=theorie)"
  }
}`;

      const res = await secureFetch('/api/gemini/generate-json-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify({
          courseId: "global",
          persona,
          context: context || "",
          prompt,
          schema: {
            type: "OBJECT",
            properties: {
              lecon: {
                type: "OBJECT",
                properties: {
                  nom: { type: "STRING" },
                  type: { type: "STRING", enum: ["theorie", "jeu"] },
                  mechanic: { type: "STRING", enum: ["flashcard", "quiz", "swipe", "pendu"] },
                  tags: { type: "ARRAY", items: { type: "STRING" } },
                  contentSource: { type: "STRING" },
                  theorieContent: { type: "STRING" }
                },
                required: ["nom", "type", "tags"]
              }
            },
            required: ["lecon"]
          }
        })
      });

      if (!res.ok) throw new Error("Erreur serveur lors de la génération");
      
      const data = await res.json();
      if (!data.lecon) throw new Error("La structure JSON retournée est invalide.");
      
      const newNiveaux = [...config.niveaux];
      const lecons = newNiveaux[nIndex].chapitres[cIndex].lecons;
      const newId = `lecon_ai_${Date.now()}`;
      
      lecons.push({
        ...data.lecon,
        id: newId
      });
      
      setConfig({ ...config, niveaux: newNiveaux });
      setExpandedLesson(newId);
      setAiSuccessMessage("Leçon générée avec succès !");
    } catch (err: any) {
      setAiError(err.message || "Erreur lors de la génération de la leçon");
    }
  };

  const deleteLecon = (nIndex: number, cIndex: number, lIndex: number) => {
    const newNiveaux = [...config.niveaux];
    newNiveaux[nIndex].chapitres[cIndex].lecons.splice(lIndex, 1);
    setConfig({ ...config, niveaux: newNiveaux });
  };

  const moveLecon = (nIndex: number, cIndex: number, lIndex: number, direction: 'up' | 'down') => {
    const newNiveaux = [...config.niveaux];
    const lecons = newNiveaux[nIndex].chapitres[cIndex].lecons;
    const targetIndex = direction === 'up' ? lIndex - 1 : lIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= lecons.length) return;
    
    const temp = lecons[lIndex];
    lecons[lIndex] = lecons[targetIndex];
    lecons[targetIndex] = temp;
    
    setConfig({ ...config, niveaux: newNiveaux });
  };

  const updateLeconField = (nIndex: number, cIndex: number, lIndex: number, field: keyof LeconConfig, value: any) => {
    const newNiveaux = [...config.niveaux];
    newNiveaux[nIndex].chapitres[cIndex].lecons[lIndex] = { 
      ...newNiveaux[nIndex].chapitres[cIndex].lecons[lIndex], 
      [field]: value 
    };
    setConfig({ ...config, niveaux: newNiveaux });
  };

  // ─── AI feature 1: Generate Learning Path ─────────────────────────
  const handleGeneratePath = async () => {
    if (!promptTopic.trim()) return;
    setGeneratingPath(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const prompt = `Génère un parcours d'apprentissage complet sur le thème "${promptTopic}". 
Le résultat doit être un objet JSON respectant exactement cette structure:
{
  "chapitres": [
    {
      "id": "chap_unique_id",
      "nom": "Nom du chapitre",
      "description": "Brève description des notions vues",
      "lecons": [
        {
          "id": "lecon_unique_id",
          "nom": "Nom de la leçon",
          "type": "theorie" | "jeu",
          "mechanic": "flashcard" | "quiz" | "swipe" | "pendu",
          "tags": ["étiquette_pedagogique_ex_argot"],
          "contentSource": "lesson",
          "theorieContent": "Contenu explicatif si type=theorie (sinon vide). Rédige une règle linguistique claire et humoristique au sujet du québécois."
        }
      ]
    }
  ]
}
Assure-toi de générer 2 chapitres, avec chacun 2 leçons (une théorie, un jeu).
N'écris aucune introduction, n'inclus pas de balises markdown, réponds EXCLUSIVEMENT avec le JSON brut.`;

      const res = await secureFetch('/api/gemini/generate-json-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify({
          courseId: "global",
          persona,
          context: context || "",
          prompt,
          schema: {
            type: "OBJECT",
            properties: {
              chapitres: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    nom: { type: "STRING" },
                    description: { type: "STRING" },
                    lecons: {
                      type: "ARRAY",
                      items: {
                        type: "OBJECT",
                        properties: {
                          id: { type: "STRING" },
                          nom: { type: "STRING" },
                          type: { type: "STRING", enum: ["theorie", "jeu"] },
                          mechanic: { type: "STRING", enum: ["flashcard", "quiz", "swipe", "pendu"] },
                          tags: { type: "ARRAY", items: { type: "STRING" } },
                          contentSource: { type: "STRING", enum: ["lesson", "chapter", "level"] },
                          theorieContent: { type: "STRING" }
                        },
                        required: ["id", "nom", "type", "tags"]
                      }
                    }
                  },
                  required: ["id", "nom", "lecons"]
                }
              }
            },
            required: ["chapitres"]
          }
        })
      });

      if (!res.ok) throw new Error("Erreur serveur lors de la génération");
      
      const data = await res.json();
      if (!data.chapitres || !Array.isArray(data.chapitres)) {
        throw new Error("La structure JSON retournée est invalide.");
      }

      // Merge into the first level or expanded level
      const targetLevelIndex = expandedNiveau !== null ? expandedNiveau : 0;
      const newNiveaux = [...config.niveaux];
      if (!newNiveaux[targetLevelIndex].chapitres) {
        newNiveaux[targetLevelIndex].chapitres = [];
      }
      
      // Assign new timestamps to avoid duplicate keys
      const formattedChapitres = data.chapitres.map((c: any, cIdx: number) => ({
        ...c,
        id: `chap_ai_${Date.now()}_${cIdx}`,
        lecons: (c.lecons || []).map((l: any, lIdx: number) => ({
          ...l,
          id: `lecon_ai_${Date.now()}_${cIdx}_${lIdx}`
        }))
      }));

      newNiveaux[targetLevelIndex].chapitres.push(...formattedChapitres);
      setConfig({ ...config, niveaux: newNiveaux });
      
      setPromptTopic('');
      setAiSuccessMessage(`Génération réussie ! ${formattedChapitres.length} chapitres ont été fusionnés au niveau ${config.niveaux[targetLevelIndex].nom}.`);
    } catch (err: any) {
      setAiError(err.message || "Erreur lors de la génération");
    } finally {
      setGeneratingPath(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto pb-24" style={{ color: theme.colors.ink }}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600 animate-pulse" />
            Éditeur de Parcours enrichi (UI/UX)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez votre curriculum de marque blanche ou laissez l'IA générer l'identité complète de votre application !
          </p>
        </div>
        <button 
          onClick={handleSave} 
          className="px-5 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2 font-black shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm self-stretch sm:self-auto justify-center"
        >
          <Save className="w-4 h-4" /> Sauvegarder tout
        </button>
      </div>

      {/* AI GENERATION TOOLS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* WIZARD 1: PATH GENERATOR */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-500 w-5 h-5" />
            <h3 className="font-black text-sm text-indigo-900 dark:text-indigo-100">Générateur de Parcours de Leçons (IA)</h3>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
            Saisissez un sujet et l'IA concevra instantanément des chapitres thématiques intégrant théories et jeux.
          </p>
          <div className="space-y-2">
            <input 
              type="text"
              value={promptTopic}
              onChange={e => setPromptTopic(e.target.value)}
              placeholder="Ex: Québécois pour travailler en construction..."
              className="w-full border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-400 outline-none"
            />
            <button
              onClick={handleGeneratePath}
              disabled={generatingPath || !promptTopic.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPath ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generatingPath ? 'Génération en cours...' : 'Générer et fusionner'}
            </button>
          </div>
        </div>
      </div>

      {/* STATUS ALERTS */}
      {aiError && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-bold">
          ⚠ {aiError}
        </div>
      )}
      {aiSuccessMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-medium flex items-start gap-2 leading-relaxed">
          <Check className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* LEVEL, CHAPTERS & LESSONS VISUAL CURRICULUM */}
      <div className="space-y-4">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-2">Curriculum Actuel de la Progression</h3>

        {config.niveaux.map((niveau, nIndex) => (
          <div 
            key={niveau.id}
            className="border rounded-2xl bg-white shadow-sm overflow-hidden border-slate-200"
          >
            {/* Level Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-all border-b border-slate-100"
              onClick={() => setExpandedNiveau(expandedNiveau === nIndex ? null : nIndex)}
            >
              <div className="flex items-center gap-3">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                  Niv {niveau.id}
                </span>
                <div className="font-black text-slate-800 text-sm">
                  {niveau.nom} 
                  <span className="text-slate-400 font-medium text-xs ml-2">({niveau.chapitres?.length || 0} chapitres)</span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => { addChapitre(nIndex); setExpandedNiveau(nIndex); }}
                  className="text-xs font-bold flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Ajouter Chapitre
                </button>
                {expandedNiveau === nIndex ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Level Chapters List */}
            {expandedNiveau === nIndex && (
              <div className="p-4 bg-white space-y-4">
                {!niveau.chapitres || niveau.chapitres.length === 0 ? (
                  <div className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Aucun chapitre défini pour ce niveau. Cliquez sur "Ajouter Chapitre" pour commencer.
                  </div>
                ) : (
                  niveau.chapitres.map((chap, cIndex) => (
                    <div key={chap.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 shadow-sm">
                      
                      {/* Chapter Title & Reorder Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Nom du Chapitre {cIndex + 1}</label>
                          <input 
                            type="text"
                            value={chap.nom}
                            onChange={e => updateChapitreField(nIndex, cIndex, 'nom', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button 
                            disabled={cIndex === 0}
                            onClick={() => moveChapitre(nIndex, cIndex, 'up')}
                            className="p-1.5 bg-white border rounded hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button 
                            disabled={cIndex === niveau.chapitres.length - 1}
                            onClick={() => moveChapitre(nIndex, cIndex, 'down')}
                            className="p-1.5 bg-white border rounded hover:bg-slate-100 disabled:opacity-40"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                          <button 
                            onClick={() => deleteChapitre(nIndex, cIndex)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => addLecon(nIndex, cIndex)}
                            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3" /> Leçon
                          </button>
                          <button 
                            onClick={() => generateLeconAi(nIndex, cIndex)}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded text-purple-600"
                            title="Générer une leçon avec l'IA"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Chapter Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Description du chapitre</label>
                        <input 
                          type="text"
                          value={chap.description || ''}
                          onChange={e => updateChapitreField(nIndex, cIndex, 'description', e.target.value)}
                          placeholder="Concepts linguistiques enseignés dans ce chapitre..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 outline-none"
                        />
                      </div>

                      {/* Chapter Lessons List */}
                      <div className="pl-4 border-l-2 border-slate-200 space-y-2 mt-2">
                        {chap.lecons.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic bg-white border border-slate-200 border-dashed p-3 rounded-lg text-center">
                            Aucune leçon définie. Créez-en une avec le bouton "+ Leçon" !
                          </div>
                        ) : (
                          chap.lecons.map((lecon, lIndex) => {
                            const isExpanded = expandedLesson === lecon.id;
                            return (
                              <div key={lecon.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                
                                {/* Lesson Header */}
                                <div 
                                  onClick={() => setExpandedLesson(isExpanded ? null : lecon.id)}
                                  className="p-2.5 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{lecon.type === 'theorie' ? '📖' : '🎮'}</span>
                                    <span className="font-bold text-slate-700">Leçon {lIndex + 1} : {lecon.nom}</span>
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase font-bold text-slate-500">
                                      {lecon.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                    <button 
                                      disabled={lIndex === 0}
                                      onClick={() => moveLecon(nIndex, cIndex, lIndex, 'up')}
                                      className="p-1 hover:bg-slate-200 rounded"
                                    >
                                      <ArrowUp className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <button 
                                      disabled={lIndex === chap.lecons.length - 1}
                                      onClick={() => moveLecon(nIndex, cIndex, lIndex, 'down')}
                                      className="p-1 hover:bg-slate-200 rounded"
                                    >
                                      <ArrowDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    <button 
                                      onClick={() => deleteLecon(nIndex, cIndex, lIndex)}
                                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                                  </div>
                                </div>

                                {/* Lesson Expanded Config */}
                                {isExpanded && (
                                  <div className="p-3 border-t border-slate-100 bg-slate-50/20 space-y-3 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nom de la Leçon</label>
                                        <input 
                                          type="text"
                                          value={lecon.nom}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'nom', e.target.value)}
                                          className="w-full bg-white border rounded-lg px-2 py-1 outline-none font-bold text-slate-800"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tags d'association (mots correspondants)</label>
                                        <input 
                                          type="text"
                                          value={lecon.tags?.join(', ') || ''}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'tags', e.target.value.split(',').map(s => s.trim()))}
                                          placeholder="salutations, bureau..."
                                          className="w-full bg-white border rounded-lg px-2 py-1 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Type de Leçon</label>
                                        <select
                                          value={lecon.type}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'type', e.target.value)}
                                          className="w-full bg-white border rounded-lg px-2 py-1 outline-none font-bold"
                                        >
                                          <option value="theorie">📖 Théorie & Règles</option>
                                          <option value="jeu">🎮 Jeu Interactif</option>
                                        </select>
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="block text-[10px] font-black uppercase text-slate-400">Mécanique de Jeu</label>
                                          <button
                                            onClick={() => handleSuggestMechanic(lecon.id, lecon.nom, lecon.tags?.join(', ') || chap.nom, nIndex, cIndex, lIndex)}
                                            disabled={suggestingLessonId === lecon.id}
                                            className="flex items-center gap-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold transition-colors disabled:opacity-50"
                                            title="Suggérer une mécanique via IA"
                                          >
                                            <Wand2 className="w-3 h-3" />
                                            {suggestingLessonId === lecon.id ? '⏳' : 'IA'}
                                          </button>
                                        </div>
                                        <select
                                          value={lecon.mechanic || 'flashcard'}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'mechanic', e.target.value)}
                                          className="w-full bg-white border rounded-lg px-2 py-1 outline-none"
                                        >
                                          <option value="flashcard">🗂️ Cartes Flash</option>
                                          <option value="quiz">📋 Choix Multiples</option>
                                          <option value="swipe">⚡ Swipe Vrai/Faux</option>
                                          <option value="pendu">🧩 Le Pendu</option>
                                          <option value="drag_drop">🧩 Drag & Drop</option>
                                          <option value="fill_in_the_blank">✍️ Texte à trous</option>
                                          <option value="memory">🧠 Jeu des Paires</option>
                                        </select>
                                        {mechanicReasons[lecon.id] && (
                                          <div className="mt-1 text-[10px] text-indigo-600 bg-indigo-50/50 p-1.5 rounded border border-indigo-100/50">
                                            💡 {mechanicReasons[lecon.id]}
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Origine du contenu (SRS)</label>
                                        <select
                                          value={lecon.contentSource || 'lesson'}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'contentSource', e.target.value)}
                                          className="w-full bg-white border rounded-lg px-2 py-1 outline-none"
                                        >
                                          <option value="lesson">Uniquement les tags de cette leçon</option>
                                          <option value="chapter">Tout le chapitre actuel</option>
                                          <option value="level">Tout le niveau actuel</option>
                                        </select>
                                      </div>
                                    </div>

                                    {lecon.type === 'theorie' && (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <label className="block text-[10px] font-black uppercase text-slate-400">Contenu de la Leçon Théorique (Markdown / Texte)</label>
                                          <button
                                            onClick={() => genererContenuLeconRAG(lecon.id, lecon.nom, nIndex, cIndex, lIndex)}
                                            disabled={generatingLessonId === lecon.id}
                                            className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded disabled:opacity-50 font-bold transition-colors"
                                          >
                                            {generatingLessonId === lecon.id ? '⏳ Génération...' : '✨ Générer via RAG'}
                                          </button>
                                        </div>
                                        <textarea 
                                          rows={4}
                                          value={lecon.theorieContent || ''}
                                          onChange={e => updateLeconField(nIndex, cIndex, lIndex, 'theorieContent', e.target.value)}
                                          placeholder="Explicatif linguistique amusant, expressions clés à retenir..."
                                          className="w-full bg-white border rounded-lg p-2 outline-none font-mono text-[11px]"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
