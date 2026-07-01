import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, RefreshCcw } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import motsData from '../../data/mots.json';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import GameHUD from '../../components/GameHUD';
import GameResult from '../../components/GameResult';

type Card = {
  id: string;
  mot: string;
  definition: string;
  exemple: string;
  pack: string;
};

export default function SwipeScreen({ onBack }: { onBack: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { addPiasses, getNiveau, getPointsConfig } = useProgression();
  const { theme } = useTheme();

  useEffect(() => {
    const niveau = getNiveau();
    const validPacks = ['0_faux_amis']; // Pokedex Faux-Amis focuses on this emergency pack

    const availableWords = motsData.filter(m => validPacks.includes(m.pack));
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5).slice(0, 15);
    setCards(shuffled);
  }, [getNiveau]);

  const currentCard = cards[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      addPiasses(getPointsConfig().swipeCorrect);
    }
    useProgression.getState().incrementStat('swipe_played');
    setFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityLeft = useTransform(x, [-100, 0], [1, 0]);
  const opacityRight = useTransform(x, [0, 100], [0, 1]);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100) {
      handleSwipe('right');
    } else if (info.offset.x < -100) {
      handleSwipe('left');
    }
  };

  if (currentIndex >= cards.length && cards.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ background: theme.colors.bg }}>
        <GameResult
          state="win"
          title="Terminé!"
          subtitle="Vous avez révisé tous les mots de cette session."
          points={cards.length * getPointsConfig().swipeCorrect}
          onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: theme.colors.bg }}>
      <div className="pt-safe">
        <GameHUD title="Swipe & Learn" onBack={onBack} />
      </div>
      
      <div className="text-center mt-2 mb-2 z-10 px-4">
        <p className="font-medium text-sm" style={{ color: theme.colors.muted }}>Glissez à droite pour "acquis", à gauche pour "réviser".</p>
        <div className="flex justify-center gap-1 mt-4 max-w-sm mx-auto flex-wrap">
          {cards.map((_, i) => (
            <div key={i} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: i < currentIndex ? theme.colors.primary : i === currentIndex ? `${theme.colors.primary}80` : 'var(--color-border)' }} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative relative perspective-1000">
        <AnimatePresence>
          {currentCard && (
            <motion.div
              key={currentCard.id}
              className="absolute w-full max-w-sm h-96 perspective-1000 preserve-3d"
              style={{ x, rotate, cursor: 'grab' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              whileDrag={{ cursor: 'grabbing' }}
            >
              {/* Overlay indicators during drag */}
              <motion.div style={{ opacity: opacityLeft }} className="absolute top-8 right-8 z-50 border-4 border-rose-500 text-rose-500 font-bold text-3xl px-4 py-1 rounded-xl rotate-12 bg-white/90">
                À RÉVISER
              </motion.div>
              <motion.div style={{ opacity: opacityRight }} className="absolute top-8 left-8 z-50 border-4 border-emerald-500 text-emerald-500 font-bold text-3xl px-4 py-1 rounded-xl -rotate-12 bg-white/90">
                ACQUIS
              </motion.div>

              {/* The Card Content */}
              <div 
                className="w-full h-full relative" 
                style={{ transformStyle: 'preserve-3d', transition: 'transform 0.4s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                onClick={() => setFlipped(!flipped)}
              >
                {/* Front */}
                <div className="absolute w-full h-full rounded-3xl shadow-xl border-2 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
                  <div className="text-sm font-bold mb-4 tracking-wider" style={{ color: theme.colors.primary }}>
                    {currentCard.pack === '0_faux_amis' ? 'Faux Amis' : currentCard.pack.replace(/_/g, ' ')}
                  </div>
                  <h2 className="text-4xl font-extrabold break-words w-full" style={{ color: theme.colors.ink }}>{currentCard.mot}</h2>
                  <p className="mt-8 flex items-center gap-2" style={{ color: theme.colors.muted }}><RefreshCcw className="w-5 h-5" /> Tapez pour retourner</p>
                </div>
                
                {/* Back */}
                <div className="absolute w-full h-full rounded-3xl shadow-xl border-2 flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}30` }}>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: theme.colors.ink }}>{currentCard.mot}</h3>
                  <div className="p-4 rounded-xl shadow-sm w-full mb-4" style={{ backgroundColor: theme.colors.surface }}>
                    <p className="font-medium text-lg leading-snug" style={{ color: theme.colors.ink }}>{currentCard.definition}</p>
                  </div>
                  {currentCard.exemple && (
                    <div className="w-full text-left p-3 rounded-lg border" style={{ backgroundColor: `${theme.colors.surface}80`, borderColor: 'var(--color-border)' }}>
                      <span className="font-bold text-xs uppercase block mb-1" style={{ color: theme.colors.primary }}>Exemple</span>
                      <p className="text-sm italic" style={{ color: theme.colors.ink }}>"{currentCard.exemple}"</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual buttons */}
      <div className="flex justify-center gap-6 pb-12 z-10 px-8">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white text-rose-500 shadow-lg border border-rose-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-8 h-8" />
        </button>
        <button 
          onClick={() => setFlipped(!flipped)}
          className="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        >
          <RefreshCcw className="w-6 h-6" />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-16 h-16 rounded-full bg-white text-emerald-500 shadow-lg border border-emerald-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Check className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
