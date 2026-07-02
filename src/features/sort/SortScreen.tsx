import { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import motsData from '../../data/mots.json';
import { motion, AnimatePresence } from 'motion/react';
import GameHUD from '../../components/GameHUD';
import GameButton from '../../components/GameButton';
import GameResult from '../../components/GameResult';

const SITUATION_MAPPING: Record<string, { label: string, icon: string }> = {
  "Nourriture": { label: "Au resto ou à l'épicerie", icon: "🍔" },
  "Magasinage": { label: "En faisant les magasins", icon: "🛍️" },
  "Argent": { label: "En parlant d'argent / Banques", icon: "💰" },
  "Transport": { label: "Dans le trafic ou le métro", icon: "🚌" },
  "Quotidien": { label: "Dans la vie de tous les jours", icon: "📅" },
  "Banque": { label: "En payant ses factures", icon: "💳" },
  "Vêtements": { label: "En s'habillant chaudement", icon: "🧤" },
  "Hiver/Météo": { label: "Pendant une tempête de neige", icon: "❄️" },
  "Météo": { label: "En regardant dehors", icon: "🌧️" },
  "Logement": { label: "Dans son appartement", icon: "🏠" },
  "Nature": { label: "Dans le bois / Au chalet", icon: "🌲" },
  "Marché du travail": { label: "En entrevue ou au bureau", icon: "💼" },
  "Emploi": { label: "Au travail avec les collègues", icon: "🏢" },
  "Administration": { label: "En faisant de la paperasse", icon: "📄" },
  "Santé": { label: "À la clinique / L'hôpital", icon: "🏥" },
  "Éducation": { label: "À l'école ou au Cégep", icon: "🎓" },
  "TEFAQ": { label: "Pendant un examen officiel", icon: "📝" },
  "Relations": { label: "Avec son chum ou sa blonde", icon: "❤️" },
  "Expressions": { label: "En jasant avec les locaux", icon: "🗣️" },
  "Émotions": { label: "Pour exprimer un feeling", icon: "😊" },
  "Expressions de base": { label: "Dans n'importe quelle conversation", icon: "👋" },
  "Culture": { label: "En découvrant le Québec", icon: "⚜️" },
  "Franglais": { label: "Dans une business (Franglais)", icon: "🤝" }
};

const DEFAULT_SITUATION = { label: "Avec des chums (Amis)", icon: "🍻" };

export default function SortScreen({ onBack }: { onBack: () => void }) {
  const { piasses, claimReward, getNiveau, getPointsConfig } = useProgression();
  const { theme } = useTheme();
  
  // Prepare 10 random words for the game based on level
  const gameWords = useMemo(() => {
    const niveau = getNiveau();
    const validPacks = ['1_survie'];
    if (niveau >= 2) validPacks.push('2_installation');
    if (niveau >= 3) validPacks.push('3_travailler');
    if (niveau >= 4) validPacks.push('4_culture');
    
    let availableWords = motsData.filter(m => validPacks.includes(m.pack));
    if (availableWords.length < 10) availableWords = motsData;
    
    return [...availableWords].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [getNiveau]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentWord = gameWords[currentIndex];
  
  // Dynamically generate the choices when current word changes
  const { choices, correctSituation } = useMemo(() => {
    if (!currentWord) return { choices: [], correctSituation: DEFAULT_SITUATION };
    
    const correct = SITUATION_MAPPING[currentWord.theme || ""] || DEFAULT_SITUATION;
    
    // Get all unique fallback situations that are NOT the correct one
    const allSituations = Object.values(SITUATION_MAPPING);
    const distractors = allSituations
      .filter(s => s.label !== correct.label)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3); // Pick 3 distractors
      
    // Combine and shuffle
    const combinedOptions = [correct, ...distractors].sort(() => 0.5 - Math.random());
    
    return { choices: combinedOptions, correctSituation: correct };
  }, [currentWord]);

  const handleAnswer = (situationLabel: string) => {
    if (hasAnswered) return;
    setSelectedTheme(situationLabel);
    setHasAnswered(true);

    if (situationLabel === correctSituation.label) {
      setScore(prev => prev + 1);
      claimReward('sort_correct');
    }
  };

  const nextWord = () => {
    if (currentIndex < gameWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedTheme(null);
      setHasAnswered(false);
    } else {
      setIsGameOver(true);
      if (score > 0) {
        useProgression.getState().incrementStat('sort_won');
      }
    }
  };

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ background: theme.colors.bg }}>
        <GameResult
          state={score > gameWords.length / 2 ? 'win' : 'lose'}
          title="Triage Terminé !"
          subtitle={`Mots correctement classés : ${score} / ${gameWords.length}`}
          points={score * getPointsConfig().sortCorrect}
          onReplay={() => {
            setCurrentIndex(0);
            setSelectedTheme(null);
            setHasAnswered(false);
            setScore(0);
            setIsGameOver(false);
          }}
          onBack={onBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8" style={{ background: theme.colors.bg }}>
      {/* Header */}
      <GameHUD title={`Mot ${currentIndex + 1} / ${gameWords.length}`} onBack={onBack} />

      {/* Main Game Interface */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-10 w-full">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: theme.colors.muted }}>Dans quel contexte commun utiliseriez-vous ce mot ?</h2>
          <motion.div 
            key={currentWord.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-8 py-10 rounded-3xl shadow-md border-b-4"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }}
          >
            <h1 className="text-5xl font-extrabold mb-4" style={{ color: theme.colors.ink }}>{currentWord.mot}</h1>
            {hasAnswered && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2 mt-4"
              >
                <p className="text-lg font-medium" style={{ color: theme.colors.ink }}>
                  {currentWord.definition}
                </p>
                <p className="text-md italic" style={{ color: theme.colors.muted }}>
                  "{currentWord.exemple}"
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
          {choices.map((situation, idx) => {
            const isCorrect = situation.label === correctSituation.label;
            const isSelected = situation.label === selectedTheme;
            
            let variant: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' = 'secondary';
            if (hasAnswered) {
              if (isCorrect) variant = 'success';
              else if (isSelected) variant = 'danger';
              else variant = 'ghost';
            }

            return (
              <GameButton
                key={idx}
                variant={variant}
                disabled={hasAnswered}
                onPress={() => handleAnswer(situation.label)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}
                fullWidth
              >
                <span className="text-2xl leading-none mr-3">{situation.icon}</span>
                <span className="flex-1 leading-tight text-sm sm:text-base">{situation.label}</span>
                {hasAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 ml-2" />}
                {hasAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500 shrink-0 ml-2" />}
              </GameButton>
            );
          })}
        </div>

        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex justify-end mt-4"
            >
              <GameButton
                variant="primary"
                size="lg"
                onPress={nextWord}
              >
                {currentIndex < gameWords.length - 1 ? 'Mot suivant' : 'Voir les résultats'}
              </GameButton>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
