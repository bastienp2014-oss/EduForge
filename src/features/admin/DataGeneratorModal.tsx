import { auth } from '../../services/firebase';
import React, { useState } from 'react';
import { secureFetch } from '../../utils/secureFetch';
import { X, Sparkles, Loader, Brain, AlertTriangle, Info, Check, HelpCircle, Target } from 'lucide-react';
import { useAdminTheme } from '../../store/useAdminTheme';

interface DataGeneratorModalProps {
  tabId: string;
  sampleItem: any;
  onClose: () => void;
  onSave: (newData: any[]) => void;
}

interface GenerationAnalysis {
  naiveLearner: string[];
  cognitiveDepth: string;
  redundancies: string[];
}

export default function DataGeneratorModal({ tabId, sampleItem, onClose, onSave }: DataGeneratorModalProps) {
  const { theme } = useAdminTheme();
  const [step, setStep] = useState<'setup' | 'review'>('setup');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatedItems, setGeneratedItems] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<GenerationAnalysis | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);

    try {
      const schemaString = sampleItem ? JSON.stringify(sampleItem, null, 2) : "{}";
      
      const res = await secureFetch('/api/gemini/generate-items-rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}` },
        body: JSON.stringify({
          courseId: "global",
          prompt: `Génère ${count} éléments pour la catégorie '${tabId}'. ${prompt}. 
Chaque objet généré dans 'items' doit suivre exactement la même structure et les mêmes clés que cet exemple: 
${schemaString}

Ensuite, analyse pédagogiquement ces éléments (R11) et remplis l'objet 'analysis' :
- naiveLearner : Liste des questions, sauts logiques ou termes non définis qu'un apprenant débutant pourrait avoir sur ces concepts.
- cognitiveDepth : Estime la profondeur cognitive requise (ex: Rappel, Compréhension, Application) avec une courte justification.
- redundancies : Liste des concepts trop similaires ou redondants parmi les éléments générés.`,
          count,
          schema: {
             type: "OBJECT"
          },
          analysisSchema: {
            type: "OBJECT",
            properties: {
              naiveLearner: { type: "ARRAY", items: { type: "STRING" } },
              cognitiveDepth: { type: "STRING" },
              redundancies: { type: "ARRAY", items: { type: "STRING" } }
            }
          }
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur serveur lors de la génération");
      }

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Le résultat ne contient pas de tableau d'items valide.");
      }

      setGeneratedItems(data.items);
      setAnalysis(data.analysis || null);
      setStep('review');
    } catch (err: any) {
      setError(err.message || "Erreur de génération");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = () => {
    onSave(generatedItems);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            {step === 'setup' ? `Générer avec l'IA (${tabId})` : "Validation & Analyse Pédagogique (R3 & R11)"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          {step === 'setup' && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre d'éléments</label>
                <input 
                  type="number" 
                  min={1} 
                  max={20}
                  value={count} 
                  onChange={e => setCount(parseInt(e.target.value) || 3)}
                  className="w-full border rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prompt / Instructions</label>
                <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ex: Génère des expressions sur le thème de l'hiver, de la neige, et du froid..."
                  className="w-full border rounded-xl px-4 py-3 min-h-[120px]"
                />
              </div>
            </>
          )}

          {step === 'review' && analysis && (
            <div className="space-y-6">
              {/* IA Partenaire Pédagogique (R11) */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-4">
                  <Brain size={18} />
                  Analyse du Partenaire Pédagogique
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-bold text-purple-900 flex items-center gap-1 mb-1">
                      <HelpCircle size={16} /> Simulation "Apprenant Naïf"
                    </h5>
                    <ul className="list-disc pl-5 text-sm text-purple-800 space-y-1">
                      {analysis.naiveLearner?.length > 0 ? (
                        analysis.naiveLearner.map((q, i) => <li key={i}>{q}</li>)
                      ) : (
                        <li className="italic text-purple-600">Aucune difficulté particulière détectée.</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-purple-900 flex items-center gap-1 mb-1">
                      <Target size={16} /> Profondeur Cognitive
                    </h5>
                    <p className="text-sm text-purple-800 pl-1">{analysis.cognitiveDepth || "Non spécifié"}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-purple-900 flex items-center gap-1 mb-1">
                      <AlertTriangle size={16} /> Détection de Redondances
                    </h5>
                    <ul className="list-disc pl-5 text-sm text-purple-800 space-y-1">
                      {analysis.redundancies?.length > 0 ? (
                        analysis.redundancies.map((r, i) => <li key={i}>{r}</li>)
                      ) : (
                        <li className="italic text-purple-600">Aucune redondance détectée.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Aperçu des items */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Aperçu des {generatedItems.length} éléments générés</h4>
                <div className="bg-slate-50 border rounded-xl p-4 max-h-60 overflow-y-auto text-sm font-mono text-slate-700">
                  <pre>{JSON.stringify(generatedItems, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          {step === 'setup' ? (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="px-4 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Analyser et Générer
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep('setup')}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                disabled={loading}
              >
                Modifier le prompt
              </button>
              <button 
                onClick={handleValidate}
                className="px-4 py-2 font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl flex items-center gap-2"
              >
                <Check size={18} />
                Valider et Publier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
