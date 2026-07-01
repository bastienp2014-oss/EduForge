import { useState, useEffect, useMemo } from 'react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import motsData from '../../data/mots.json';
import { motion, AnimatePresence } from 'motion/react';
import GameHUD from '../../components/GameHUD';
import GameButton from '../../components/GameButton';
import GameResult from '../../components/GameResult';

const MAX_MISTAKES = 7;

export default function PenduScreen({ onBack }: { onBack: () => void }) {
  const { piasses, depenserPiasses, motsDebloques, getNiveau } = useProgression();
  const { theme } = useTheme();
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const availableWords = useMemo(() => {
    const niveau = getNiveau();
    const validPacks = ['1_survie'];
    if (niveau >= 2) validPacks.push('2_installation');
    if (niveau >= 3) validPacks.push('3_travailler');
    if (niveau >= 4) validPacks.push('4_culture');
    return motsData.filter(m => validPacks.includes(m.pack));
  }, [getNiveau]);

  const initiateGame = () => {
    // Only pick words that are reasonably short for screen flow in Pendu
    const suitableWords = availableWords.filter(m => m.mot.length <= 15 && !m.mot.includes(':'));
    const pickFrom = suitableWords.length > 0 ? suitableWords : availableWords;
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const index = availableWords.findIndex(m => m.id === item.id) || 0;

    setCurrentWordIndex(index);
    setGuessedLetters(new Set());
    setMistakes(0);
    setGameState('playing');
  };

  useEffect(() => {
    initiateGame();
  }, [availableWords]);

  const currentWordData = availableWords[currentWordIndex] || availableWords[0];
  // Remove accents and special chars for the game logic, but keep display original?
  // Hangman is easier without accents, or we provide unaccented equivalent.
  // Standardize the word for matching: normalize to NFD and remove diacritics.
  const normalizedWord = useMemo(() => {
    return currentWordData.mot.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }, [currentWordData]);

  const rawLetters = normalizedWord.split('');

  const displayLetters = useMemo(() => {
     return rawLetters.map((char) => {
        if (!/[a-z]/.test(char)) return char; // space or dash
        return guessedLetters.has(char) ? char : "_";
     });
  }, [rawLetters, guessedLetters]);

  const handleGuess = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!normalizedWord.includes(letter)) {
       const newMistakes = mistakes + 1;
       setMistakes(newMistakes);
       if (newMistakes >= MAX_MISTAKES) {
          setGameState('lost');
       }
    } else {
       // Check win
       const won = rawLetters.every(char => !/[a-z]/.test(char) || newGuessed.has(char));
       if (won) {
          setGameState('won');
          depenserPiasses(-15); // Earning 15 piasses
          useProgression.getState().incrementStat('pendu_won');
       }
    }
  };

  const keyboardRows = [
    "qwertyuiop".split(""),
    "asdfghjkl".split(""),
    "zxcvbnm".split("")
  ];

  const renderBonhomme = () => {
     return (
        <div className="flex flex-col justify-center items-center h-[180px] shrink-0 mb-4 sm:mb-6">
           <svg 
              width="160" 
              height="180" 
              viewBox="0 0 160 180" 
              style={{
                stroke: mistakes >= MAX_MISTAKES ? theme.colors.danger : theme.colors.ink,
                fill: 'none',
                transition: 'stroke 0.3s ease'
              }}
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
           >
              {/* 1. Base et Poteau vertical */}
              {mistakes >= 1 && <path d="M 20 170 h 80 M 60 170 V 20" />}
              
              {/* 2. Poteau du haut, support et corde */}
              {mistakes >= 2 && <path d="M 57 20 H 120 V 40 M 60 60 L 100 20" />}
              
              {/* 3. Tête */}
              {mistakes >= 3 && <circle cx="120" cy="60" r="20" />}
              
              {/* 4. Corps */}
              {mistakes >= 4 && <line x1="120" y1="80" x2="120" y2="125" />}
              
              {/* 5. Bras gauche */}
              {mistakes >= 5 && <line x1="120" y1="95" x2="95" y2="115" />}
              
              {/* 6. Bras droit */}
              {mistakes >= 6 && <line x1="120" y1="95" x2="145" y2="115" />}
              
              {/* 7. Jambes / Yeux en X si perdu */}
              {mistakes >= 7 && (
                 <g>
                    <path d="M 120 125 L 95 160 M 120 125 L 145 160" />
                    {/* Yeux en X */}
                    <path d="M 112 55 L 116 59 M 116 55 L 112 59" strokeWidth="3" />
                    <path d="M 124 55 L 128 59 M 128 55 L 124 59" strokeWidth="3" />
                 </g>
              )}
           </svg>
           <div className="mt-4 font-bold text-xl" style={{ color: theme.colors.danger }}>
              {mistakes} / {MAX_MISTAKES}
           </div>
        </div>
     );
  };

  return (
    <div className="flex flex-col min-h-screen p-6 relative overflow-hidden" style={{ background: theme.colors.bg, color: theme.colors.ink }}>
      
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col min-h-full">
        {/* Header */}
        <GameHUD title="Pendu" onBack={onBack} />

        {/* Game Area */}
        <div className="flex-1 flex flex-col items-center justify-start mb-2 sm:mb-6 w-full">
          {renderBonhomme()}
          
          <div className="text-center mb-4 sm:mb-8 w-full">
             <div className="text-xs sm:text-sm uppercase font-bold mb-2 sm:mb-4 tracking-widest" style={{ color: theme.colors.muted }}>
                 Découvrez le mot québécois
             </div>
             
             <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-8 px-2 sm:px-4">
                {displayLetters.map((char, index) => (
                  <span 
                     key={index} 
                     className="text-3xl sm:text-4xl font-extrabold uppercase"
                     style={{ color: char === '_' ? theme.colors.muted : theme.colors.ink }}
                  >
                     {char}
                  </span>
                ))}
             </div>

             <div className="p-3 sm:p-4 rounded-xl border mx-4 backdrop-blur-sm italic text-sm sm:text-base max-h-28 overflow-y-auto" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border || 'transparent', color: theme.colors.muted }}>
                Indice : "{currentWordData.definition}"
             </div>
          </div>

          {/* Keyboard or Result */}
          <div className="w-full mt-auto">
             {gameState === 'playing' ? (
                <div className="flex flex-col gap-2 w-full max-w-lg mx-auto">
                   {keyboardRows.map((row, i) => (
                      <div key={i} className="flex justify-center gap-1 sm:gap-2 w-full px-1">
                         {row.map(key => {
                            const isGuessed = guessedLetters.has(key);
                            const isMistake = isGuessed && !normalizedWord.includes(key);
                            const isCorrect = isGuessed && normalizedWord.includes(key);

                            let variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'secondary';
                            if (isMistake) variant = 'danger';
                            if (isCorrect) variant = 'success';

                            return (
                               <GameButton
                                 key={key}
                                 variant={variant}
                                 disabled={isGuessed}
                                 onPress={() => handleGuess(key)}
                                 style={{ flex: 1, maxWidth: '3rem', height: '3rem', padding: 0 }}
                               >
                                  <span style={{ fontSize: '1.125rem' }}>{key}</span>
                               </GameButton>
                            );
                         })}
                      </div>
                   ))}
                </div>
             ) : (
                <GameResult
                   state={gameState === 'won' ? 'win' : 'lose'}
                   title={gameState === 'won' ? 'Bravo !' : 'Vous êtes pendu !'}
                   subtitle={gameState === 'lost' ? `Le mot était : ${currentWordData.mot}` : undefined}
                   points={gameState === 'won' ? 15 : 0}
                   onReplay={initiateGame}
                   onBack={onBack}
                />
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
