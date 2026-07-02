import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, Coins } from 'lucide-react';
import { useProgression } from '../../store/useProgression';
import { useTheme } from '../../store/useTheme';
import { useSrs } from '../../store/useSrs';
import { contentProvider } from '../../services/contentProvider';
import { ContentItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { analytics } from '../../services/analytics';
import GameHUD from '../../components/GameHUD';
import GameButton from '../../components/GameButton';
import GameResult from '../../components/GameResult';

export default function QuizScreen({ onBack }: { onBack: () => void }) {
  const piasses = useProgression(s => s.piasses);
  const claimReward = useProgression(s => s.claimReward);
  const getNiveau = useProgression(s => s.getNiveau);
  const getPointsConfig = useProgression(s => s.getPointsConfig);
  const { theme } = useTheme();
  
  // Use SRS and Content Hub
  const srsCards = useSrs(s => Object.values(s.cards));
  
  // Dynamically select questions from Content Hub and prioritize SRS due items
  const questions = useMemo(() => {
    const niveau = getNiveau();
    const allItems = contentProvider.getItemsByNiveau(niveau);
    
    // Filter only items that have options (like Quiz) or we can generate them
    const quizItems = allItems.filter(item => item.module === 'quiz');
    
    // Fallback logic if the items are standard words, we could generate fake options
    // but here we just take the quiz items
    
    return [...quizItems].sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [getNiveau]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    analytics.moduleStarted('quiz');
  }, []);

  const question = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(index);
    setHasAnswered(true);

    const isCorrect = question.payload.options![index] === question.payload.answer;

    analytics.answerRecorded({
      module: 'quiz',
      correct: isCorrect,
      item_id: question.id,
    });

    if (isCorrect) {
      setScore(prev => prev + 1);
      claimReward('quiz_correct'); // Use configured amount
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setIsGameOver(true);
      const isCorrect = selectedAnswer !== null && question.payload.options![selectedAnswer] === question.payload.answer;
      analytics.moduleCompleted('quiz', score + (isCorrect ? 1 : 0));
      useProgression.getState().incrementStat('quiz_played');
    }
  };

  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ background: theme.colors.bg }}>
        <GameResult
          state={score > questions.length / 2 ? 'win' : 'lose'}
          title="Quiz Terminé !"
          subtitle={`Vous avez eu ${score} / ${questions.length} bonnes réponses.`}
          points={score * getPointsConfig().quizCorrect}
          onReplay={() => {
            setCurrentIndex(0);
            setSelectedAnswer(null);
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
      <GameHUD title={`Question ${currentIndex + 1} / ${questions.length}`} onBack={onBack} />

      {/* Main Game Interface */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col">
        <div className="rounded-3xl p-6 md:p-8 shadow-sm border mb-6" style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}>
          <h2 className="text-2xl font-semibold mb-8" style={{ color: theme.colors.ink }}>{question.payload.question}</h2>
          
          <div className="space-y-4">
            {(question.payload.options || []).map((opt: string, idx: number) => {
              const isCorrect = opt === question.payload.answer;
              const isSelected = idx === selectedAnswer;
              
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
                  onPress={() => handleAnswer(idx)}
                  fullWidth
                  style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}
                >
                  <span className="flex-1 text-lg leading-tight">{opt}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 ml-2" />}
                  {hasAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-red-500 shrink-0 ml-2" />}
                </GameButton>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-6 shadow-sm border"
              style={{ backgroundColor: theme.colors.surface, borderColor: 'var(--color-border)' }}
            >
              <div className="flex gap-4 items-start mb-6">
                <div className="p-3 rounded-full shrink-0" style={{ backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary }}>
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: theme.colors.ink }}>Explication</h3>
                  <p style={{ color: theme.colors.muted }}>{question.payload.exemple}</p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <GameButton
                  variant="primary"
                  size="lg"
                  onPress={nextQuestion}
                >
                  {currentIndex < questions.length - 1 ? 'Question suivante' : 'Voir les résultats'}
                </GameButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
