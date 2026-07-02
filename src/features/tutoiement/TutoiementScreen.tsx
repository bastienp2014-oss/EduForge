import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import tutoData from '../../data/tutoiement.json';
import { useProgression } from '../../store/useProgression';

type GameState = 'playing' | 'success' | 'failure' | 'finished';

interface TutoiementScreenProps {
  onBack: () => void;
}

export default function TutoiementScreen({ onBack }: TutoiementScreenProps) {
  const { claimReward, getPointsConfig } = useProgression();
  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);

  const currentLevel = tutoData[levelIndex];

  useEffect(() => {
    if (currentLevel) {
      // Shuffle options (erreur_frequente vs approche_quebecoise)
      const opts = [
        { text: currentLevel.erreur_frequente, isCorrect: false },
        { text: currentLevel.approche_quebecoise, isCorrect: true }
      ];
      if (Math.random() > 0.5) {
        opts.reverse();
      }
      setOptions(opts);
      setGameState('playing');
    }
  }, [levelIndex, currentLevel]);

  const handleSelection = (isCorrect: boolean) => {
    if (gameState !== 'playing') return;
    
    if (isCorrect) {
      setGameState('success');
      claimReward('tutoiement_correct');
      if (levelIndex === tutoData.length - 1) {
        setTimeout(() => setGameState('finished'), 2500);
      }
    } else {
      setGameState('failure');
    }
  };

  const nextLevel = () => {
    if (levelIndex < tutoData.length - 1) {
      setLevelIndex(prev => prev + 1);
    }
  };

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-4">Module Complété !</h1>
        <p className="text-slate-600 mb-8 max-w-sm">Vous avez compris les nuances du tutoiement au Québec. N'ayez plus peur de tutoyer pour créer des liens de proximité !</p>
        <button
          onClick={onBack}
          className="bg-amber-500 text-white font-bold py-4 px-8 rounded-2xl hover:bg-amber-600 transition-all shadow-lg active:scale-95"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!currentLevel) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="p-4 sm:p-6 flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-full text-slate-600 hover:border-slate-300 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <span className="text-base">🤝</span> 
            Tutoiement
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center font-bold text-amber-600 bg-amber-100 rounded-full">
          {levelIndex + 1}/{tutoData.length}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col mt-4">
        
        <div className="w-full text-center space-y-4 mb-8">
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">Contexte</p>
          <div className="bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {currentLevel.contexte}
            </h2>
          </div>
        </div>

        <p className="text-center text-slate-500 font-medium mb-6">Quelle approche choisissez-vous ?</p>

        {/* Options */}
        <div className="w-full flex justify-center flex-col gap-3 sm:gap-4 mb-8">
          {options.map((opt, index) => {
            const isSelectedCorrect = gameState === 'success' && opt.isCorrect;
            const isSelectedWrong = gameState === 'failure' && !opt.isCorrect;
            return (
              <button
                key={`opt-${index}`}
                onClick={() => handleSelection(opt.isCorrect)}
                disabled={gameState !== 'playing'}
                className={`w-full text-left p-5 sm:p-6 border-2 font-bold text-lg sm:text-xl rounded-2xl shadow-sm transition-all
                  ${gameState === 'playing' ? 'bg-white border-slate-200 hover:border-amber-400 text-slate-700 active:scale-[0.98]' : ''}
                  ${isSelectedCorrect ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/25' : ''}
                  ${isSelectedWrong ? 'bg-rose-500 border-rose-600 text-white shadow-rose-500/25' : ''}
                  ${gameState !== 'playing' && !isSelectedCorrect && !isSelectedWrong ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50' : ''}
                `}
              >
                "{opt.text}"
              </button>
            )
          })}
        </div>

        {/* Feedback Area */}
        {gameState === 'failure' && (
          <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300 mb-8">
             <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 flex gap-4">
               <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
               <div className="space-y-2">
                 <h3 className="font-bold text-rose-900 text-lg">C'est un peu trop formel !</h3>
                 <p className="text-rose-700 font-medium leading-relaxed">{currentLevel.explication}</p>
                 <button 
                    onClick={() => setGameState('playing')}
                    className="mt-4 w-full bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold py-3 rounded-xl transition-colors active:scale-95"
                  >
                    Réessayer
                  </button>
               </div>
             </div>
          </div>
        )}

        {gameState === 'success' && (
          <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300 mb-8">
            <div className="bg-emerald-100 border-2 border-emerald-500/20 rounded-3xl p-6 text-emerald-800 shadow-lg shadow-emerald-500/10">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                <div className="space-y-3 flex-1">
                  <h3 className="font-black text-xl">Bien joué !</h3>
                  <p className="font-medium text-emerald-700 leading-relaxed">{currentLevel.explication}</p>
                  <button 
                    onClick={nextLevel}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md active:scale-95"
                  >
                    Situation suivante
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
