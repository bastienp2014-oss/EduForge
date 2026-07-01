import React from 'react';
import { useTheme } from '../../store/useTheme';
import { InteractiveTeaser } from '../../components/InteractiveTeaser';
import { DynamicGameScreen } from '../arcade/DynamicGameScreen';
import { ArrowLeft, Monitor } from 'lucide-react';
import { useGames } from '../../store/useGames';

export default function MarketingPreviewScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const games = useGames(s => s.games);
  
  // Find a suitable game for the teaser, e.g., memory match or quiz
  const teaserGame = games.find(g => g.mechanic === 'quiz') || games[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Fake Browser Toolbar */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Monitor className="w-4 h-4" />
            <span>Prévisualisation Landing Page (Vue Apprenant)</span>
          </div>
        </div>
      </div>

      {/* Fake Landing Page Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Section */}
        <div className="bg-white py-24 text-center px-4" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
          <h1 className="text-5xl md:text-6xl font-black mb-6" style={{ color: theme.colors.ink, fontFamily: 'Sora, sans-serif' }}>
            Maîtrisez le Québécois
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed" style={{ color: theme.colors.muted }}>
            Apprenez les expressions, les sacres et la culture québécoise de manière ludique et interactive.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
              Commencer gratuitement
            </button>
            <button className="px-8 py-4 rounded-full font-bold text-lg border-2 hover:bg-slate-50 transition-colors" style={{ borderColor: theme.colors.border, color: theme.colors.ink }}>
              Voir les cours
            </button>
          </div>
        </div>

        {/* Interactive Island Section */}
        <div className="py-24 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full font-bold text-sm tracking-wider uppercase" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                Testez votre niveau
              </div>
              <h2 className="text-4xl font-black leading-tight" style={{ color: theme.colors.ink, fontFamily: 'Sora, sans-serif' }}>
                Connaissez-vous vraiment le Québec ?
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: theme.colors.muted }}>
                Testez vos connaissances dès maintenant ! Répondez à ces quelques questions pour évaluer votre niveau de compréhension des expressions d'ici.
              </p>
              
              <ul className="space-y-4 mt-8">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: theme.colors.primary }}>1</div>
                  <span style={{ color: theme.colors.ink }}>Découvrez des expressions authentiques.</span>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: theme.colors.primary }}>2</div>
                  <span style={{ color: theme.colors.ink }}>Apprenez dans un format ludique et rapide.</span>
                </li>
              </ul>
            </div>

            {/* The Teaser itself */}
            <div className="relative mt-8 lg:mt-0">
              {/* Fake iPhone/Device Frame - Hidden on small screens to avoid "mobile inside mobile" effect */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-[2.5rem] shadow-2xl transform rotate-1 scale-105"></div>
              
              <div className="relative bg-white md:rounded-[2rem] rounded-2xl overflow-hidden shadow-xl md:border-4 md:border-slate-800 h-[600px] w-full max-w-sm mx-auto flex flex-col">
                <div className="hidden md:flex bg-slate-800 text-white py-2 justify-center items-center gap-2 text-xs font-medium">
                  <div className="w-16 h-4 bg-slate-900 rounded-full"></div>
                </div>
                
                <div className="flex-1 relative">
                  {teaserGame ? (
                    <InteractiveTeaser 
                      maxInteractions={3}
                      timeLimitSeconds={30}
                      ctaTitle="Bravo ! Vous avez la piqûre ?"
                      ctaDescription="Créez votre compte gratuit pour continuer à apprendre et débloquer toutes les leçons."
                      ctaButtonText="Je m'inscris gratuitement"
                      onSignupClick={() => alert("Redirection vers la page d'inscription de l'apprenant !")}
                    >
                      <DynamicGameScreen gameId={teaserGame.id} onBack={() => {}} demoMode={true} />
                    </InteractiveTeaser>
                  ) : (
                    <div className="p-8 text-center">Aucun jeu configuré.</div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
