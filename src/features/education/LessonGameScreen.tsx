import React, { useMemo } from 'react';
import { useProgression, LeconConfig } from '../../store/useProgression';
import { useSrs } from '../../store/useSrs';
import { contentProvider } from '../../services/contentProvider';
import { COMPATIBILITY_MATRIX, MechanicId, ContentItem } from '../../types';
import { FlashcardSRS, Hangman, MultipleChoice, BinarySwipe } from '../../mechanics';
import { ArrowLeft, Trophy, Star, Zap } from 'lucide-react';

interface LessonGameScreenProps {
  lessonId: string;
  onBack: () => void;
}

export default function LessonGameScreen({ lessonId, onBack }: LessonGameScreenProps) {
  const progressionConfig = useProgression(s => s.progressionConfig);
  const completerLecon = useProgression(s => s.completerLecon);
  const addXp = useProgression(s => s.addXp);
  const addPiasses = useProgression(s => s.addPiasses);
  const { enregistrerReponse } = useSrs();

  // Find the lesson in the progression structure
  const lesson = useMemo(() => {
    for (const niveau of progressionConfig.niveaux) {
      if (niveau.chapitres) {
        for (const chap of niveau.chapitres) {
          const found = chap.lecons.find(l => l.id === lessonId);
          if (found) return found;
        }
      }
    }
    return null;
  }, [progressionConfig, lessonId]);

  // Fetch relevant content items matching the lesson tags
  const items = useMemo(() => {
    if (!lesson) return [];
    
    // Get all content up to current level
    const allItems = contentProvider.getItemsByNiveau(8); // fetch all items to be safe
    
    // Filter items by lesson tags
    let filtered = allItems.filter(item => {
      const itemTags = item.tags || [];
      return lesson.tags.some(tag => itemTags.includes(tag as any) || tag.toLowerCase() === item.module.toLowerCase());
    });

    // If no items match, fall back to any items of equivalent levels
    if (filtered.length === 0) {
      filtered = allItems.slice(0, 5);
    }

    // Filter by mechanic compatibility
    const mechId = lesson.mechanic || 'flashcard';
    const constraint = COMPATIBILITY_MATRIX[mechId as MechanicId];
    if (constraint) {
      filtered = filtered.filter(item => constraint.isCompatible(item));
    }

    return filtered.slice(0, 8); // Limit to 8 items per lesson for focus
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Leçon introuvable.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl">Retour</button>
      </div>
    );
  }

  const handleComplete = (score: number) => {
    // 1. Mark lesson as completed
    completerLecon(lessonId);

    // 2. Award XP and Piasses
    const finalXp = 25 + score;
    const finalPiasses = 10 + Math.floor(score / 5);
    addXp(finalXp);
    addPiasses(finalPiasses);

    // 3. Register all items in SRS queue so they start appearing in Spaced Repetition reviews
    items.forEach(item => {
      // Rating 3 corresponds to 'Pass' / 'Good' initial status
      enregistrerReponse(item.id, 3);
    });

    // Show completion overlay or direct back
    alert(`Félicitations ! Tu as complété la leçon "${lesson.nom}" !\n+${finalXp} XP et +${finalPiasses} $ ont été ajoutés à ta tirelire !\n\nLes mots vus dans cette leçon sont maintenant planifiés dans ton moteur de révision SRS !`);
    onBack();
  };

  const handleResponse = (itemId: string, rating: number) => {
    // Intermediate responses during the game are registered directly in SRS
    enregistrerReponse(itemId, rating as any);
  };

  const mechanic = lesson.mechanic || 'flashcard';

  switch (mechanic) {
    case 'flashcard':
      return <FlashcardSRS items={items} onBack={onBack} onComplete={handleComplete} onResponse={handleResponse} />;
    case 'quiz':
      return <MultipleChoice items={items} onBack={onBack} onComplete={handleComplete} onResponse={handleResponse} />;
    case 'pendu':
      return <Hangman items={items} onBack={onBack} onComplete={handleComplete} onResponse={handleResponse} />;
    case 'swipe':
      return <BinarySwipe items={items} onBack={onBack} onComplete={handleComplete} onResponse={handleResponse} />;
    default:
      return <FlashcardSRS items={items} onBack={onBack} onComplete={handleComplete} onResponse={handleResponse} />;
  }
}
