import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '../../store/useAdminTheme';
import { Wand2, Loader2, CheckCircle2, ChevronDown, ChevronUp, Search, Activity, AlertCircle } from 'lucide-react';

interface MarketingData {
  headline: string;
  subheadline: string;
  benefits: { title: string; description: string }[];
  targetAudience: string;
  salesPitch: string;
  callToAction: string;
}

interface AdminMarketingGeneratorProps {
  productName: string;
  productType: 'course' | 'bundle';
  description: string;
}

export default function AdminMarketingGenerator({ productName, productType, description }: AdminMarketingGeneratorProps) {
  const { theme } = useAdminTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Nouveaux états pour le SEO
  const [seoKeyword, setSeoKeyword] = useState('');
  const [keywordDensity, setKeywordDensity] = useState(0);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);

  // Effet pour calculer l'analyse SEO en temps réel
  useEffect(() => {
    if (!marketingData) return;

    // Combiner tout le texte généré
    const fullText = `
      ${marketingData.headline} 
      ${marketingData.subheadline} 
      ${marketingData.benefits.map(b => b.title + ' ' + b.description).join(' ')} 
      ${marketingData.salesPitch}
    `.toLowerCase();

    // Extraire les mots
    const words: string[] = fullText.match(/[a-zà-ÿ0-9]+/g) || [];
    const totalWords = words.length;
    setWordCount(totalWords);

    if (totalWords === 0) return;

    // Calcul de la densité si un mot clé est défini
    if (seoKeyword.trim()) {
      const targetWord = seoKeyword.toLowerCase().trim();
      const regex = new RegExp(`\\b${targetWord}\\b`, 'gi');
      const matches = fullText.match(regex) || [];
      const density = (matches.length / totalWords) * 100;
      setKeywordDensity(density);
    } else {
      setKeywordDensity(0);
    }

    // Extraire des mots-clés suggérés (mots de plus de 5 lettres, les plus fréquents)
    const wordCounts = words.reduce((acc: Record<string, number>, word: string) => {
      // Ignorer les mots de liaison basiques
      if (word.length > 5 && !['comment', 'pourquoi', 'toujours', 'parce'].includes(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
      
    setSuggestedKeywords(topKeywords);

  }, [marketingData, seoKeyword]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/generate-marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(window as any).firebaseToken || ''}`, // In a real scenario, use actual auth token retrieval
        },
        body: JSON.stringify({
          productName,
          productType,
          description,
          targetAudience,
          tone
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const data = await response.json();
      setMarketingData(data);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsGenerating(false);
    }
  };

  const inputClass = "w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 text-sm";
  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: `${theme.colors.muted}30`,
    color: theme.colors.ink,
  };

  // Helper pour l'indicateur SEO
  const getSeoStatus = () => {
    if (!seoKeyword) return { color: 'text-gray-500', bg: 'bg-gray-100', text: 'En attente' };
    if (keywordDensity === 0) return { color: 'text-red-600', bg: 'bg-red-100', text: 'Mot-clé absent' };
    if (keywordDensity < 1) return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Densité faible' };
    if (keywordDensity <= 3) return { color: 'text-green-600', bg: 'bg-green-100', text: 'Optimisé (Parfait)' };
    return { color: 'text-red-600', bg: 'bg-red-100', text: 'Suroptimisé (Risque de spam)' };
  };

  const seoStatus = getSeoStatus();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl border" style={{ backgroundColor: theme.colors.surface, borderColor: `${theme.colors.muted}20` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold" style={{ color: theme.colors.ink }}>
              Générateur de Page de Vente (IA)
            </h3>
            <p className="text-sm mt-1" style={{ color: theme.colors.muted }}>
              Générez et optimisez automatiquement votre argumentaire marketing.
            </p>
          </div>
          <Wand2 className="w-6 h-6 text-purple-500" />
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Cible (Optionnel)</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Débutants, Professionnels..."
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: theme.colors.ink }}>Ton (Optionnel)</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Ex: Enthousiaste, Formel..."
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !productName}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 text-white"
            style={{ backgroundColor: '#8b5cf6' }} // Purple for AI
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isGenerating ? 'Génération en cours...' : 'Générer la page de vente'}
          </button>
          
          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </div>

        {marketingData && (
          <div className="space-y-6 mt-6">
            {/* Panneau SEO */}
            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800">Analyse SEO en temps réel</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot-clé principal cible</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={seoKeyword}
                      onChange={(e) => setSeoKeyword(e.target.value)}
                      placeholder="Ex: formation react"
                      className="pl-9 pr-4 py-2 w-full rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-slate-900"
                    />
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Densité</span>
                        <span className={seoStatus.color}>{keywordDensity.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${seoStatus.bg.replace('100', '500')}`}
                          style={{ width: `${Math.min(keywordDensity * 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${seoStatus.bg} ${seoStatus.color}`}>
                      {seoStatus.text}
                    </span>
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-6">
                  <span className="block text-sm font-medium text-slate-700 mb-2">Mots-clés suggérés</span>
                  <div className="flex flex-wrap gap-2">
                    {suggestedKeywords.map((kw, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSeoKeyword(kw)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Texte long de {wordCount} mots
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden" style={{ borderColor: `${theme.colors.muted}30` }}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5"
                onClick={() => setShowPreview(!showPreview)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-bold" style={{ color: theme.colors.ink }}>Aperçu de la page de vente</span>
                </div>
                {showPreview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              
              {showPreview && (
                <div className="p-6 bg-white border-t" style={{ borderColor: `${theme.colors.muted}20` }}>
                  {/* Landing Page Preview */}
                  <div className="max-w-2xl mx-auto space-y-8 text-center">
                    <div className="space-y-4">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        {marketingData.targetAudience}
                      </span>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                        {marketingData.headline}
                      </h1>
                      <p className="text-lg text-gray-600">
                        {marketingData.subheadline}
                      </p>
                      <button className="mt-4 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                        {marketingData.callToAction}
                      </button>
                    </div>

                    <div className="pt-8 pb-4 text-left">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Ce que vous allez accomplir</h2>
                      <div className="grid gap-6">
                        {marketingData.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                              ✓
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{benefit.title}</h4>
                              <p className="text-gray-600 text-sm mt-1">{benefit.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl text-left border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-2">Argumentaire</h3>
                      <div className="prose prose-sm text-gray-600 whitespace-pre-line">
                        {marketingData.salesPitch}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
