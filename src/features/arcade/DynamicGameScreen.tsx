import React, { useMemo, useEffect, useState } from 'react';
import { useGames, GameConfig } from '../../store/useGames';
import { FlashcardSRS, Hangman, MultipleChoice, BinarySwipe, MemoryMatch, ClozeTest, SortGroup, Anagram, Sequencing, LineMatching, Bingo, SituationalChoice, CategoryBlaster, TileMerge, WordSearch, ChainReaction, CombinationBuilder, DialogueTree, RebusPuzzle, AudioTranscription, ErrorCorrection, DeceptivePairs, DiagramLabeling, VoiceRecording, AudioAB } from '../../mechanics';
import { useProgression } from '../../store/useProgression';
import { useSrs } from '../../store/useSrs';
import { contentProvider } from '../../services/contentProvider';
import { ContentItem } from '../../types';
import motsData from '../../data/mots.json';

import { mapMechanicData } from '../../services/mechanicDataMapper';

import { COMPATIBILITY_MATRIX, MechanicId, BaseGameProps } from '../../types';

const MECHANIC_COMPONENTS: Record<string, React.ElementType<BaseGameProps>> = {
  flashcard: FlashcardSRS,
  quiz: MultipleChoice,
  pendu: Hangman,
  hangman: Hangman,
  swipe: BinarySwipe,
  memory: MemoryMatch,
  fill_in_the_blank: ClozeTest,
  drag_drop: SortGroup,
  anagram: Anagram,
  sequencing: Sequencing,
  line_matching: LineMatching,
  bingo: Bingo,
  situational_choice: SituationalChoice,
  category_blaster: CategoryBlaster,
  tile_merge: TileMerge,
  word_search: WordSearch,
  chain_reaction: ChainReaction,
  combination_builder: CombinationBuilder,
  dialogue_tree: DialogueTree,
  rebus_puzzle: RebusPuzzle,
  audio_transcription: AudioTranscription,
  error_correction: ErrorCorrection,
  deceptive_pairs: DeceptivePairs,
  diagram_labeling: DiagramLabeling,
  voice_recording: VoiceRecording,
  audio_ab: AudioAB,
};

// We map a dynamic game to the right mechanic
interface DynamicGameScreenProps {
  gameId: string;
  onBack: () => void;
  onResponse?: (itemId: string, rating: number) => void;
  demoMode?: boolean;
}

export function DynamicGameScreen({ gameId, onBack, onResponse, demoMode }: DynamicGameScreenProps) {
  const games = useGames(s => s.games);
  const { claimReward } = useProgression();
  const { preparerSession, getSessionCards, enregistrerReponse } = useSrs();
  const game = games.find(g => g.id === gameId);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    if (game && !demoMode) {
      preparerSession({ tags: game.tags, mechanic: game.mechanic });
      setIsSessionReady(true);
    } else if (game && demoMode) {
      setIsSessionReady(true);
    }
  }, [game, preparerSession, demoMode]);

  // Derive data based on game tags
  const gameData = useMemo(() => {
    if (!game || !isSessionReady) return [];
    
    if (demoMode) {
      // In demo mode, bypass user level restrictions and SRS logic
      // Grab 5-10 items that match the game's mechanics/tags from ANY level
      const allItems = contentProvider.getItemsByNiveau(999);
      let matchedItems = allItems;
      
      const mechanicDef = COMPATIBILITY_MATRIX[game.mechanic as MechanicId];
      if (mechanicDef) {
        matchedItems = matchedItems.filter(i => mechanicDef.isCompatible(i as any));
      }
      
      if (game.tags && game.tags.length > 0) {
        const tagMatchedItems = matchedItems.filter(i => {
          const itemTags = (i as any).tags || [];
          return game.tags!.some(t => itemTags.includes(t));
        });
        // Only apply tags filter if it actually matches something
        if (tagMatchedItems.length > 0) {
          matchedItems = tagMatchedItems;
        }
      }
      
      // We take the first 10 for the demo
      return matchedItems.slice(0, 10);
    }

    // Normal SRS flow
    const srsCards = getSessionCards();
    
    return srsCards.map(card => {
      const allItems = contentProvider.getItemsByNiveau(useProgression.getState().getNiveau());
      const itemData = allItems.find(i => i.id === card.itemId);
      return itemData;
    }).filter(Boolean) as ContentItem[];
  }, [game, isSessionReady, getSessionCards, demoMode]);

  if (!game || !isSessionReady) return null;

  const handleComplete = (score: number) => {
    if (!demoMode) {
      claimReward('arcade_score', { score });
    }
  };

  const handleResponse = (itemId: string, rating: number) => {
    if (!demoMode) {
      enregistrerReponse(itemId, rating);
    }
    if (onResponse) onResponse(itemId, rating);
  };

  const GameComponent = MECHANIC_COMPONENTS[game.mechanic];

  if (GameComponent) {
    const specificData = mapMechanicData(game.mechanic, gameData);

    return (
      <GameComponent
        items={gameData}
        data={specificData}
        onBack={onBack}
        onComplete={handleComplete}
        onResponse={handleResponse}
        isEmbedded={demoMode}
      />
    );
  }

  return (
    <div className="p-8 text-center text-slate-500">
      <p>La mécanique "{game.mechanic}" est en cours de construction.</p>
      <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-200 rounded">Retour</button>
    </div>
  );
}
