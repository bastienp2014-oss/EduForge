import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';
import tuData from '../../data/tu_interrogatif.json';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';

type GameState = 'playing' | 'success' | 'finished';

interface TuScreenProps {
  onBack: () => void;
}

export default function TuInterrogatifScreen({ onBack }: TuScreenProps) {
  const { claimReward, getPointsConfig } = useProgression();
  const { theme } = useTheme();
  const [levelIndex, setLevelIndex] = useState(0);
  const [shuffledChunks, setShuffledChunks] = useState<string[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [showExplication, setShowExplication] = useState(false);

  const currentLevel = tuData[levelIndex];

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
      const builtString = newSelected.join('');
      const targetString = currentLevel.chunks.join(''); // original order
      
      if (builtString === targetString) {
        setGameState('success');
        claimReward('tu_correct');
        if (levelIndex === tuData.length - 1) {
          setTimeout(() => setGameState('finished'), 1500);
        }
      } else {
        // Wrong order, let them try again by resetting or providing a reset button
        // For simplicity, auto-reset after delay
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
    if (levelIndex < tuData.length - 1) {
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
        <p className="mb-8 max-w-sm" style={{ color: theme.colors.muted }}>Vous maîtrisez maintenant l'art du "tu" interrogatif. Les Québécois n'auront plus de secrets pour vous !</p>
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
          <div className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.colors.muted }}>Le "Tu" Interrogatif</div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center font-bold rounded-full" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
          {levelIndex + 1}/{tuData.length}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center mt-4">
        
        <div className="w-full text-center space-y-4 mb-10">
          <p className="font-medium" style={{ color: theme.colors.muted }}>Comment diriez-vous au Québec ?</p>
          <div className="border-2 rounded-3xl p-6 shadow-sm relative overflow-hidden" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.colors.ink }}>"{currentLevel.standard}"</h2>
          </div>
        </div>

        {/* Builder Area */}
        <div className="w-full min-h-[120px] border-2 border-dashed rounded-3xl p-6 flex flex-wrap content-start gap-2 mb-8 relative" style={{ backgroundColor: `${theme.colors.surface}80`, borderColor: 'var(--color-border)' }}>
          {selectedChunks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center font-medium pointer-events-none" style={{ color: theme.colors.muted }}>
              Construisez la phrase ici...
            </div>
          )}
          {selectedChunks.map((chunk, i) => (
            <div 
              key={`sel-${i}`}
              className={`px-4 py-2 text-lg sm:text-xl font-bold rounded-xl shadow-sm transition-all
                ${gameState === 'success' ? 'text-white shadow-emerald-500/25' : 'text-white'}
                ${selectedChunks.length === currentLevel.chunks.length && gameState !== 'success' ? 'bg-rose-500 shadow-rose-500/25' : ''}
              `}
              style={gameState === 'success' ? { backgroundColor: theme.colors.success } : { backgroundColor: theme.colors.primary }}
            >
              {chunk}
            </div>
          ))}
          {selectedChunks.length > 0 && gameState === 'playing' && (
            <button 
              onClick={undoLast}
              className="ml-auto px-4 py-2 border-2 rounded-xl transition-colors flex items-center justify-center"
              style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)', color: theme.colors.ink }}
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
                  <h3 className="font-black text-xl">C'est en plein ça !</h3>
                  <p className="font-medium text-emerald-700 leading-relaxed">{currentLevel.explication}</p>
                  <button 
                    onClick={nextLevel}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
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
          <div className="w-full flex justify-center flex-wrap gap-3">
            {shuffledChunks.map((chunk, index) => (
              <button
                key={`chunk-${index}`}
                onClick={() => handleChunkClick(chunk, index)}
                className="px-5 py-3 bg-white border-2 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 font-bold text-lg sm:text-xl rounded-2xl shadow-sm transition-all active:scale-95"
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
            className="mt-12 flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors font-medium text-sm"
          >
            <HelpCircle className="w-4 h-4" /> 
            {showExplication ? 'Masquer l\'indice' : 'Besoin d\'un indice ?'}
          </button>
        )}

        {showExplication && gameState === 'playing' && (
           <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-sm max-w-sm text-center">
              L'astuce : Le fameux "-tu" se place juste après le verbe conjugué de la question !
           </div>
        )}

      </main>
    </div>
  );
}
