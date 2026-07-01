export interface FlashcardSRSData {
  _type?: 'FlashcardSRSData';
}

export interface MultipleChoiceData {
  _type?: 'MultipleChoiceData';
  config?: {
    timer?: number;
  };
}

export interface BinarySwipeItem {
  id: string;
  question?: string;
  answer: string;
  explanation?: string;
}

export interface BinarySwipeData {
  _type?: 'BinarySwipeData';
  config?: {
    left?: { label: string; emoji: string; color: string };
    right?: { label: string; emoji: string; color: string };
  };
}

export interface MemoryMatchData {
  config?: {
    gridCols?: number;
    flipBackDelay?: number;
  };
  pairs: Array<{
    id: string;
    cardA: {
      text: string;
      image?: string;
    };
    cardB: {
      text: string;
      image?: string;
    };
  }>;
}

export interface HangmanData {
  _type?: 'HangmanData';
  config?: {
    maxErr?: number;
  };
}

export type MechanicDataLot1 =
  | FlashcardSRSData
  | MultipleChoiceData
  | BinarySwipeData
  | MemoryMatchData
  | HangmanData;

export interface AnagramData {
  words: Array<{
    word: string;
    hint: string;
  }>;
}

export interface ClozeTestData {
  exercises: Array<{
    text: string;
    blanks: Array<{
      id: string;
      answer: string;
      alternatives?: string[];
    }>;
  }>;
}

export type MechanicDataLot2 =
  | AnagramData
  | ClozeTestData
  | SequencingData
  | SortGroupData
  | LineMatchingData;

export interface SequencingItem {
  id: string;
  text: string;
  label?: string; // It's optional if some mechanics don't use it, but here it says string
  order: number;
}

export interface SequencingData {
  config?: {
    showLabels?: boolean;
  };
  items: SequencingItem[];
}

export interface SortGroupItem {
  id: string;
  groupId: string;
  text: string;
}

export interface SortGroupGroup {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface SortGroupData {
  config?: {
    validateMode?: string;
  };
  groups: SortGroupGroup[];
  items: SortGroupItem[];
}

export interface LineMatchingData {
  config?: {
    shuffleRight?: boolean;
  };
  pairs: Array<{
    id: string;
    left: {
      text: string;
    };
    right: {
      text: string;
    };
  }>;
}

export interface BingoData {
  config?: {
    gridSize?: number;
    callerMode?: 'auto' | 'manual';
    callerInterval?: number;
  };
  items: Array<{
    id: string;
    term: string;
    clue: string;
  }>;
}

export interface SituationalChoiceData {
  scenarios: Array<{
    id: string;
    situation: string;
    question: string;
    choices: Array<{
      id: string;
      text: string;
      register: string;
      correct: boolean;
      feedback: string;
    }>;
  }>;
}

export interface CategoryBlasterData {
  config?: {
    baseTimeMs?: number;
    speedupFactor?: number;
    minTimeMs?: number;
    comboBonus?: boolean;
  };
  categories: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;
  items: Array<{
    id: string;
    text: string;
    categoryId: string;
  }>;
}

export interface TileMergeData {
  config?: {
    gridSize?: number;
  };
  tileBank: Array<{
    id: string;
    label: string;
    pairId: string;
    sourceId?: string;
  }>;
}

export interface WordSearchData {
  config?: {
    gridSize?: number;
    hintMode?: 'word' | 'hint';
  };
  words: Array<{
    id: string;
    word: string;
    hint: string;
  }>;
}

export type MechanicDataLot3 =
  | BingoData
  | SituationalChoiceData
  | CategoryBlasterData
  | TileMergeData
  | WordSearchData;

export interface ChainReactionData {
  config?: {
    timerSeconds?: number;
  };
  wordBank: Array<{
    id: string;
    word: string;
    startLetter: string;
    endLetter: string;
  }>;
}

export interface CombinationBuilderData {
  config?: {
    maxSpins?: number;
  };
  reels: Array<{
    id: string;
    items: string[];
  }>;
  validCombinations: Array<{
    combo: string[];
    result: string;
    definition: string;
    points: number;
  }>;
}

export interface DialogueTreeData {
  config?: {
    character: {
      name: string;
      avatar: string;
    };
  };
  startNode: string;
  nodes: Record<string, {
    npc: string;
    isEnd?: boolean;
    outcome?: 'win' | 'neutral' | 'lose';
    choices?: Array<{
      text: string;
      next: string;
      points?: number;
      feedback?: string;
    }>;
  }>;
}

export interface RebusPuzzleData {
  config?: {
    hintLevel?: number;
  };
  puzzles: Array<{
    itemId?: string;
    pieces: Array<{
      emoji: string;
      sound: string;
    }>;
    answer: string;
    choices: string[];
    explanation: string;
  }>;
}

export interface AudioTranscriptionData {
  config?: {
    maxReplays?: number;
    tolerance?: number;
    hint?: string;
  };
  items: Array<{
    itemId?: string;
    expected: string;
    audioUrl?: string;
    normalize?: boolean;
    points: number;
  }>;
}

export type MechanicDataLot4 =
  | ChainReactionData
  | CombinationBuilderData
  | DialogueTreeData
  | RebusPuzzleData
  | AudioTranscriptionData;

export interface ErrorCorrectionData {
  config?: {
    showErrorCount?: boolean;
  };
  exercises: Array<{
    itemId?: string;
    text: string;
    errors: Array<{
      id: string;
      start: number;
      end: number;
      wrong: string;
      correct: string;
      explanation: string;
    }>;
  }>;
}

export interface DeceptivePairsData {
  config?: {
    contextA?: string;
    contextB?: string;
  };
  pairs: Array<{
    itemId?: string;
    term: string;
    meaningA: string;
    explanation: string;
    etymology?: string;
    choices: Array<{
      id: string;
      text: string;
      correct: boolean;
      isMeaningA?: boolean;
    }>;
  }>;
}

export interface DiagramLabelingData {
  config?: {
    tolerancePct?: number;
  };
  image?: string;
  labels: Array<{
    id: string;
    itemId?: string;
    text: string;
    zone: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface VoiceRecordingData {
  config?: {
    maxAttempts?: number;
  };
  items: Array<{
    itemId?: string;
    text: string;
    phonetic?: string;
    difficulty: number;
    referenceAudio?: string;
  }>;
}

export interface AudioABData {
  config?: {
    criterion?: string;
  };
  pairs: Array<{
    itemId?: string;
    label: string;
    audioA?: string;
    audioB?: string;
    correct: 'A' | 'B';
    explanation: string;
  }>;
}

export type MechanicDataLot5 =
  | ErrorCorrectionData
  | DeceptivePairsData
  | DiagramLabelingData
  | VoiceRecordingData
  | AudioABData;
