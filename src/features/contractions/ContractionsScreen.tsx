import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';
import AudioPlayer from '../../components/AudioPlayer';
import contrData from '../../data/contractions.json';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { analytics } from '../../services/analytics';

type GameState = 'playing' | 'success' | 'finished';

interface ContractionsScreenProps {
  onBack: () => void;
}

export default function ContractionsScreen({ onBack }: ContractionsScreenProps) {
  const { addPiasses, getPointsConfig } = useProgression();
  const { theme } = useTheme();
  const [levelIndex, setLevelIndex] = useState(0);
  const [shuffledChunks, setShuffledChunks] = useState<string[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [showExplication, setShowExplication] = useState(false);

  useEffect(() => {
    analytics.moduleStarted('contractions');
  }, []);

  const currentLevel = contrData[levelIndex];

  useEffect(() => {
    if (currentLevel) {
      // Shuffle chunks
      const chunks = [...currentLevel.chunks];
      for (let i = chunks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
      }
      setShuffledChunks(chunks);
      setSelectedChunks([]);
      setGameState('playing');
      setShowExplication(false);
    }
  }, [levelIndex, currentLevel]);

  const handleChunkClick = (chunk: string, index: number) => {
    if (gameState !== 'playing') return;
    
    setShuffledChunks(prev => prev.filter((_, i) => i !== index));
    const newSelected = [...selectedChunks, chunk];
    setSelectedChunks(newSelected);

    // Check if finished
    if (newSelected.length === currentLevel.chunks.length) {
      // For contractions, chunks might have spaces included or just be parts.
      // We join them and normalize spaces to compare
      const builtString = newSelected.join(' ').replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim();
      const targetString = currentLevel.chunks.join(' ').replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim();
      
      // Let's use simple join to check exactly since chunks map exact pieces
      const exactBuilt = newSelected.join('').replace(/\s+/g, ' ').trim();
      const exactTarget = currentLevel.chunks.join('').replace(/\s+/g, ' ').trim();
      
      // Also allow space-joined comparison just in case standard json chunks need spaces.
      const originalChunksJoined = currentLevel.chunks.join('');

      if (newSelected.join('') === originalChunksJoined) {
        setGameState('success');
        addPiasses(getPointsConfig().contractionsCorrect);
        analytics.answerRecorded({ module: 'contractions', correct: true, item_id: currentLevel.id });
        if (levelIndex === contrData.length - 1) {
          analytics.moduleCompleted('contractions', levelIndex + 1);
          setTimeout(() => setGameState('finished'), 1500);
        }
      } else {
        // Wrong order, auto-reset after delay
        setTimeout(() => {
          setSelectedChunks([]);
          const chunks = [...currentLevel.chunks];
          for (let i = chunks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
          }
          setShuffledChunks(chunks);
        }, 1000);
      }
    }
  };

  const undoLast = () => {
    if (selectedChunks.length === 0 || gameState !== 'playing') return;
    const last = selectedChunks[selectedChunks.length - 1];
    setSelectedChunks(prev => prev.slice(0, -1));
    setShuffledChunks(prev => [...prev, last]);
  };

  const nextLevel = () => {
    if (levelIndex < contrData.length - 1) {
      setLevelIndex(prev => prev + 1);
    }
  };

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: theme.colors.bg }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${theme.colors.success}20`, color: theme.colors.success }}>
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black mb-4" style={{ color: theme.colors.ink }}>Module Complété !</h1>
        <p className="mb-8 max-w-sm" style={{ color: theme.colors.muted }}>Vous maîtrisez maintenant les Contractions Orales. La vitesse et la fusion des mots québécoises n'auront plus de secrets pour vous !</p>
        <button
          onClick={onBack}
          className="font-bold py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 text-white"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  if (!currentLevel) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.colors.bg }}>
      <header className="p-4 sm:p-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${theme.colors.bg}CC` }}>
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center border-2 rounded-full transition-colors"
          style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)', color: theme.colors.ink }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: theme.colors.muted }}>
            <span className="text-base">⚡</span> 
            Contractions Orales
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center font-bold rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
          {levelIndex + 1}/{contrData.length}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center mt-4">
        
        <div className="w-full text-center space-y-4 mb-10">
          <p className="font-medium" style={{ color: theme.colors.muted }}>Comment prononce-t-on ceci rapidement au Québec ?</p>
          <div className="border-2 rounded-3xl p-6 shadow-sm relative overflow-hidden" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.colors.ink }}>"{currentLevel.standard}"</h2>
          </div>
        </div>

        {/* Builder Area */}
        <div className="w-full min-h-[120px] border-2 border-dashed rounded-3xl p-6 flex flex-wrap content-start gap-1 sm:gap-2 mb-8 relative" style={{ backgroundColor: `${theme.colors.surface}80`, borderColor: 'var(--color-border)' }}>
          {selectedChunks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center font-medium pointer-events-none" style={{ color: theme.colors.muted }}>
              Construisez la phrase contractée ici...
            </div>
          )}
          {selectedChunks.map((chunk, i) => (
            <div 
              key={`sel-${i}`}
              className={`px-3 py-2 sm:px-4 sm:py-2 text-lg sm:text-x font-bold rounded-xl shadow-sm transition-all text-white
                ${gameState === 'success' ? 'shadow-emerald-500/25' : (selectedChunks.length === currentLevel.chunks.length ? 'bg-rose-500 shadow-rose-500/25' : '')}
              `}
              style={gameState === 'success' ? { backgroundColor: theme.colors.success } : (selectedChunks.length === currentLevel.chunks.length ? {} : { backgroundColor: theme.colors.primary })}
            >
              {chunk}
            </div>
          ))}
          {selectedChunks.length > 0 && gameState === 'playing' && (
            <button 
              onClick={undoLast}
              className="ml-auto px-4 py-2 border-2 rounded-xl transition-colors flex items-center justify-center"
              style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)', color: theme.colors.muted }}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Floating Success Alert */}
        {gameState === 'success' && (
          <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-emerald-100 border-2 border-emerald-500/20 rounded-3xl p-6 text-emerald-800 shadow-lg shadow-emerald-500/10 mb-8">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
                <div className="space-y-3 flex-1">
                  <h3 className="font-black text-xl">Exactement !</h3>
                  <p className="font-medium text-emerald-700 leading-relaxed drop-shadow-sm">{currentLevel.explication}</p>
                  <AudioPlayer
                    text={(currentLevel as any).result || currentLevel.standard}
                    compact={false}
                    showSpeedControl={true}
                  />
                  <button 
                    onClick={nextLevel}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md active:scale-95"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Options */}
        {gameState !== 'success' && (
          <div className="w-full flex justify-center flex-wrap gap-2 sm:gap-3">
            {shuffledChunks.map((chunk, index) => (
              <button
                key={`chunk-${index}`}
                onClick={() => handleChunkClick(chunk, index)}
                className="px-4 py-2 sm:px-5 sm:py-3 bg-white border-2 border-slate-200 hover:border-purple-400 hover:text-purple-600 text-slate-700 font-bold text-lg sm:text-xl rounded-2xl shadow-sm transition-all active:scale-95"
              >
                {chunk}
              </button>
            ))}
          </div>
        )}
        
        {/* Hint button */}
        {gameState === 'playing' && (
          <button 
            onClick={() => setShowExplication(!showExplication)}
            className="mt-12 flex items-center gap-2 text-slate-400 hover:text-purple-500 transition-colors font-medium text-sm"
          >
            <HelpCircle className="w-4 h-4" /> 
            {showExplication ? 'Masquer l\'indice' : 'Besoin d\'un indice ?'}
          </button>
        )}

        {showExplication && gameState === 'playing' && (
           <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-800 text-sm max-w-sm text-center">
              L'astuce : N'oubliez pas les espaces, les apostrophes, et liez les morceaux pour imiter le "mâchage" des mots !
           </div>
        )}

      </main>
    </div>
  );
}
