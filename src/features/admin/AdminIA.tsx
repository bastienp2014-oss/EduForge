import { auth } from '../../services/firebase';
import React, { useState, useRef } from 'react';
import { useSettings } from '../../store/useSettings';
import { useAdminTheme } from '../../store/useAdminTheme';
import { useAppConfig } from '../../store/useAppConfig';
import { useTheme } from '../../store/useTheme';
import { useProgression } from '../../store/useProgression';
import { Key, Save, Trash2, Wand2, Image as ImageIcon, Loader2, Gamepad2, ShieldAlert, FileText, Upload, Layout } from 'lucide-react';

export default function AdminIA() {
  const { theme } = useAdminTheme();
  const c = theme.colors;
  const { apiKey, setApiKey, clearApiKey, persona, setPersona, context, setContext, appGenerationPrompt, setAppGenerationPrompt, documents, addDocument, removeDocument } = useSettings();
  const { features, setAppName, setAppDescription, setMarketingSlogan } = useAppConfig();
  const { patchPersonal } = useTheme();
  const updateProgressionConfig = useProgression(s => s.updateProgressionConfig);
  const getPointsConfig = useProgression(s => s.getPointsConfig);
  const addCustomContentItems = useProgression(s => s.addCustomContentItems);
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputPersona, setInputPersona] = useState(persona);
  const [inputContext, setInputContext] = useState(context);
  const [inputAppPrompt, setInputAppPrompt] = useState(appGenerationPrompt);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgRatio, setImgRatio] = useState('1:1');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  
  const [gameIdea, setGameIdea] = useState('');
  const [isGeneratingGame, setIsGeneratingGame] = useState(false);
  const [isGeneratingScaffold, setIsGeneratingScaffold] = useState(false);
  const [lessonSubject, setLessonSubject] = useState('');
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<string | null>(null);
  const [lessonSources, setLessonSources] = useState<number>(0);

  const genererScaffold = async () => {
    if (!inputAppPrompt) return;
    setIsGeneratingScaffold(true);
    try {
      const response = await fetch('/api/gemini/generate-scaffold-rag', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          prompt: inputAppPrompt,
          persona,
          courseId: "global",
          context
        })
      });
      if (!response.ok) throw new Error("Erreur lors de la génération de l'architecture");
      const data = await response.json();
      
      if (data && data.appName) {
        // Appliquer le nom
        setAppName(data.appName);
        
        if (data.appDescription) setAppDescription(data.appDescription);
        if (data.marketingSlogan) setMarketingSlogan(data.marketingSlogan);

        // Appliquer les couleurs
        if (data.colors) {
          patchPersonal({
            colors: {
              primary: data.colors.primary,
              accent: data.colors.accent,
              bg: data.colors.bg,
              surface: data.colors.surface,
              ink: data.colors.ink,
              muted: data.colors.muted,
              header: data.colors.primary, // fallback
              gold: '#F5C542',
              success: '#2F7A52',
              danger: '#C73C3C'
            }
          });
        }

        // Construire les niveaux et leçons
        if (data.parcours && Array.isArray(data.parcours)) {
          const DEFAULT_POINTS = getPointsConfig();
          const niveaux = data.parcours.map((chap, i) => {
            return {
              id: i + 1,
              nom: chap.nom,
              seuilScore: i * 100, // arbitraire
              points: { ...DEFAULT_POINTS },
              chapitres: [{
                id: `chap_${Date.now()}_${i}`,
                nom: chap.nom,
                description: chap.description,
                lecons: chap.lecons.map((lec, j) => ({
                  id: `lec_${Date.now()}_${i}_${j}`,
                  nom: lec.nom,
                  type: 'theorie',
                  mechanic: undefined,
                  tags: [],
                  theorieContent: lec.description
                }))
              }]
            };
          });

          updateProgressionConfig({ niveaux });
        }
        
        // Build and inject vocabulary as ContentItems
        if (data.vocabulary && Array.isArray(data.vocabulary)) {
          const contentItems = data.vocabulary.map((v: any) => ({
            id: v.id || `voc_${Date.now()}_${Math.random()}`,
            module: 'mots',
            niveau: 1,
            tags: ['vocabulaire'],
            payload: {
              question: undefined,
              answer: v.mot,
              translation: v.definition,
              exemple: v.exemple || "Exemple généré automatiquement."
            }
          }));
          addCustomContentItems(contentItems);
        }
        
        alert("Architecture générée et appliquée avec succès !");
      }
    } catch (error) {
      console.error(error);
      alert("Erreur: " + error);
    } finally {
      setIsGeneratingScaffold(false);
    }
  };

  const genererJeu = async () => {
    if (!gameIdea) return;
    setIsGeneratingGame(true);
    try {
      const response = await fetch('/api/gemini/generate-json-rag', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({ 
          courseId: 'global',
          prompt: `Génère une configuration de jeu éducatif. Idée: ${gameIdea}. 
La mécanique doit être l'une de: 'quiz', 'flashcard', 'pendu', 'swipe', 'typing'.
Donne un identifiant unique (id), un nom (name), un emoji (icon), une description courte, la mécanique, et des tags.`, 
          persona,
          context: context || "",
          schema: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              name: { type: "STRING" },
              icon: { type: "STRING" },
              description: { type: "STRING" },
              mechanic: { type: "STRING" },
              tags: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["id", "name", "icon", "description", "mechanic", "tags"]
          }
        })
      });
      if (!response.ok) throw new Error("Erreur génération jeu");
      const data = await response.json();
      
      const { useGames } = await import('../../store/useGames');
      useGames.getState().addGame({
        ...data,
        enabled: true
      });
      alert(`Jeu "${data.name}" généré et ajouté à l'Arcade !`);
      setGameIdea('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du jeu");
    } finally {
      setIsGeneratingGame(false);
    }
  };

  const genererLeconRAG = async () => {
    if (!lessonSubject) return;
    setIsGeneratingLesson(true);
    try {
      const response = await fetch('/api/gemini/generate-lesson-rag', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          courseId: "global",
          subject: lessonSubject,
          prompt: inputAppPrompt,
          persona
        })
      });
      if (!response.ok) throw new Error("Erreur génération de leçon");
      const data = await response.json();
      
      setGeneratedLesson(data.lesson);
      setLessonSources(data.sources);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de la leçon RAG");
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleSave = () => {
    setApiKey(inputKey);
    setPersona(inputPersona);
    setContext(inputContext);
    setAppGenerationPrompt(inputAppPrompt);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClear = () => {
    setInputKey('');
    clearApiKey();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de parsing");
      }

      const data = await response.json();
      
      const ingestResponse = await fetch('/api/gemini/rag-ingest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          courseId: "global",
          text: data.text
        })
      });

      if (!ingestResponse.ok) {
        const errorData = await ingestResponse.json();
        throw new Error(errorData.error || "Erreur lors de l'ingestion RAG");
      }

      addDocument({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
      });
      
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const genererImage = async () => {
    if (!imgPrompt) return;
    setIsGeneratingImg(true);
    setGeneratedImg(null);
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`,
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({ prompt: imgPrompt, aspectRatio: imgRatio })
      });
      if (!response.ok) throw new Error("Erreur génération image");
      const data = await response.json();
      setGeneratedImg(`data:${data.mimeType};base64,${data.base64}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de l'image");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  return (
    <div className="space-y-6" style={{ color: c.ink }}>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ background: c.primary, color: c.surface }} className="p-2 rounded-xl">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 style={{ color: c.ink }} className="text-2xl font-bold">
            Assistant IA & Génération
          </h2>
          <p className="text-sm" style={{ color: c.muted }}>
            Configurez votre clé API (BYOK) pour débloquer les fonctionnalités de génération par intelligence artificielle.
          </p>
        </div>
      </div>

      <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
            <Key size={20} style={{ color: c.muted }} />
            Clé API Gemini (BYOK)
          </h3>
          <p className="text-sm" style={{ color: c.muted }}>
            Entrez votre propre clé d'API Gemini pour générer du contenu éducatif, des images et des mini-jeux sans restriction.
            Cette clé est stockée localement dans votre navigateur.
          </p>
          
          <div className="flex gap-2 max-w-xl">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 border text-sm rounded-xl px-4 py-2 outline-none transition-all"
              style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
            />
            {apiKey && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors"
                title="Supprimer la clé"
                style={{ backgroundColor: `color-mix(in srgb, ${c.danger} 10%, transparent)`, color: c.danger }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          <div className="pt-4 border-t" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
            <h4 className="font-bold text-sm mb-2" style={{ color: c.ink }}>Personnalité de l'Assistant (System Prompt)</h4>
            <textarea
              value={inputPersona}
              onChange={(e) => setInputPersona(e.target.value)}
              placeholder="Ex: Tu es un professeur de français très strict..."
              className="w-full h-20 border text-sm rounded-xl px-4 py-3 outline-none transition-all resize-none"
              style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
            />
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-sm mb-2" style={{ color: c.ink }}>Base de connaissances (Contexte additionnel)</h4>
            <div className="space-y-3">
              <textarea
                value={inputContext}
                onChange={(e) => setInputContext(e.target.value)}
                placeholder="Collez ici du texte, du vocabulaire ou des règles de grammaire que l'IA doit toujours prendre en compte."
                className="w-full h-32 border text-sm rounded-xl px-4 py-3 outline-none transition-all resize-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />

              <div className="p-4 rounded-xl border border-dashed flex flex-col gap-3" style={{ borderColor: `color-mix(in srgb, ${c.ink} 20%, transparent)` }}>
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm flex items-center gap-2" style={{ color: c.ink }}>
                    <FileText size={16} /> Documents (PDF, Word, TXT)
                  </h5>
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload}
                      className="hidden" 
                      accept=".pdf,.docx,.txt,.md"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      style={{ backgroundColor: `color-mix(in srgb, ${c.primary} 10%, transparent)`, color: c.primary }}
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Téléverser
                    </button>
                  </div>
                </div>

                {documents && documents.length > 0 ? (
                  <ul className="space-y-2">
                    {documents.map(doc => (
                      <li key={doc.id} className="flex items-center justify-between p-2 rounded-lg text-sm border" style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
                        <span className="truncate font-medium flex-1">{doc.name}</span>
                        {doc.size ? <span className="text-xs mr-3 opacity-60">({Math.round(doc.size / 1024)} kb)</span> : (doc.content ? <span className="text-xs mr-3 opacity-60">({Math.round(doc.content.length / 1024)} kb)</span> : null)}
                        <button 
                          onClick={() => removeDocument(doc.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-center py-2" style={{ color: c.muted }}>Aucun document téléversé</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
            <h4 className="font-bold text-sm mb-2" style={{ color: c.ink }}>Prompt de génération d'Application</h4>
            <textarea
              value={inputAppPrompt}
              onChange={(e) => setInputAppPrompt(e.target.value)}
              placeholder="Prompt utilisé par l'IA pour générer une application complète..."
              className="w-full h-24 border text-sm rounded-xl px-4 py-3 outline-none transition-all resize-none"
              style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{ background: isSaved ? c.success : c.primary }}
            >
              <Save size={18} />
              {isSaved ? 'Sauvegardé' : 'Sauvegarder la configuration'}
            </button>
          </div>
        </div>
      </div>

      {!features.enableAiGenerator && (
        <div className="p-4 rounded-xl flex items-center gap-3 border" style={{ backgroundColor: c.bg, borderColor: c.danger, color: c.danger }}>
          <ShieldAlert size={20} />
          <p className="font-bold text-sm">L'Assistant IA est désactivé pour cette instance.</p>
        </div>
      )}

      {features.enableAiGenerator && (
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
              <ImageIcon size={20} style={{ color: c.muted }} />
              Générateur d'Images
            </h3>
            <p className="text-sm" style={{ color: c.muted }}>
              Créez des badges, icônes, et éléments visuels pour l'application en utilisant le modèle Gemini.
            </p>

            <div className="space-y-4">
              <textarea 
                value={imgPrompt}
                onChange={e => setImgPrompt(e.target.value)}
                placeholder="Décrivez l'image à générer... (ex: Un badge doré avec une étoile, style pixel art, fond transparent)"
                className="w-full h-24 p-3 border rounded-xl resize-none text-sm outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
              <div className="flex gap-4">
                <select 
                  value={imgRatio} 
                  onChange={e => setImgRatio(e.target.value)}
                  className="border text-sm rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                >
                  <option value="1:1">1:1 (Carré)</option>
                  <option value="16:9">16:9 (Paysage)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                </select>
                <button 
                  onClick={genererImage}
                  disabled={isGeneratingImg || !imgPrompt || !apiKey}
                  className="flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                  style={{ background: c.primary }}
                >
                  {isGeneratingImg ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  Générer
                </button>
              </div>
              
              {!apiKey && (
                <p className="text-xs text-red-500">Veuillez configurer une clé API pour utiliser cette fonctionnalité.</p>
              )}

              {generatedImg && (
                <div className="mt-4 p-4 border rounded-xl flex flex-col items-center gap-4" style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
                  <img src={generatedImg} alt="Généré par IA" className="max-w-full rounded-lg shadow-sm" />
                  <a 
                    href={generatedImg} 
                    download={`generation_${Date.now()}.png`}
                    className="text-sm font-bold px-4 py-2 border rounded-lg transition-colors hover:opacity-80"
                    style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
                  >
                    Télécharger
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {features.enableGameGenerator && (
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
              <Gamepad2 size={20} style={{ color: c.muted }} />
              Créateur de Jeux (Arcade)
            </h3>
            <p className="text-sm" style={{ color: c.muted }}>
              Décrivez un concept de jeu éducatif. L'IA sélectionnera la mécanique appropriée et générera la configuration du jeu.
              Le jeu sera automatiquement ajouté à l'Arcade.
            </p>

            <div className="space-y-4">
              <textarea 
                value={gameIdea}
                onChange={e => setGameIdea(e.target.value)}
                placeholder="Ex: Un jeu pour apprendre le vocabulaire de la cuisine (glisser-déposer)."
                className="w-full h-20 p-3 border rounded-xl resize-none text-sm outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
              <div className="flex justify-end">
                <button 
                  onClick={genererJeu}
                  disabled={isGeneratingGame || !gameIdea || !apiKey}
                  className="flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                  style={{ background: c.primary }}
                >
                  {isGeneratingGame ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  Générer et Ajouter
                </button>
              </div>
              {!apiKey && (
                <p className="text-xs" style={{ color: c.danger }}>Veuillez configurer une clé API pour utiliser cette fonctionnalité.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {features.enableAiGenerator && (
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
              <FileText size={20} style={{ color: c.muted }} />
              Leçon RAG : Générateur de contenu
            </h3>
            <p className="text-sm" style={{ color: c.muted }}>
              Générez le contenu complet d'une leçon à partir des documents RAG indexés.
            </p>

            <div className="space-y-4">
              <textarea 
                value={lessonSubject}
                onChange={e => setLessonSubject(e.target.value)}
                placeholder="Ex: Le verbe être au présent"
                className="w-full h-20 p-3 border rounded-xl resize-none text-sm outline-none"
                style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 15%, transparent)`, color: c.ink }}
              />
              <div className="flex justify-end">
                <button 
                  onClick={genererLeconRAG}
                  disabled={isGeneratingLesson || !lessonSubject || !apiKey}
                  className="flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                  style={{ background: c.primary }}
                >
                  {isGeneratingLesson ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                  Générer
                </button>
              </div>
              
              {!apiKey && (
                <p className="text-xs" style={{ color: c.danger }}>Veuillez configurer une clé API pour utiliser cette fonctionnalité.</p>
              )}

              {generatedLesson && (
                <div className="mt-4 p-4 border rounded-xl" style={{ backgroundColor: c.bg, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: `color-mix(in srgb, ${c.primary} 15%, transparent)`, color: c.primary }}>
                      {lessonSources} source{lessonSources > 1 ? 's' : ''} utilisée{lessonSources > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap" style={{ color: c.ink }}>
                    {generatedLesson}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {features.enableAiGenerator && (
        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: c.surface, borderColor: `color-mix(in srgb, ${c.ink} 10%, transparent)` }}>
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: c.ink }}>
              <Layout size={20} style={{ color: c.muted }} />
              Scaffolding : Générateur d'Application Complète
            </h3>
            <p className="text-sm" style={{ color: c.muted }}>
              Générez le plan d'une application d'apprentissage entière basée sur votre Prompt de génération d'Application. Ceci inclut la thématique visuelle, le nom, et l'arborescence des leçons.
            </p>

            <div className="space-y-4">
              <button 
                onClick={genererScaffold}
                disabled={isGeneratingScaffold || !inputAppPrompt || !apiKey}
                className="flex items-center gap-2 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
                style={{ background: c.primary }}
              >
                {isGeneratingScaffold ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                Générer l'Architecture (Scaffold)
              </button>
              
              {!apiKey && (
                <p className="text-xs" style={{ color: c.danger }}>Veuillez configurer une clé API pour utiliser cette fonctionnalité.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
