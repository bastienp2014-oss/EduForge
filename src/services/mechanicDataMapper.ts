import { ContentItem, MechanicId } from '../types';
import { MechanicDataLot1, MechanicDataLot2, MechanicDataLot3, MechanicDataLot4, MechanicDataLot5 } from '../types/mechanics';

export function mapMechanicData(mechanicId: string, items: ContentItem[]): MechanicDataLot1 | MechanicDataLot2 | MechanicDataLot3 | MechanicDataLot4 | MechanicDataLot5 | null {
  if (!items || items.length === 0) return null;

  switch (mechanicId) {
    case 'flashcard':
      return { _type: 'FlashcardSRSData' };

    case 'quiz':
      return { _type: 'MultipleChoiceData' };

    case 'swipe':
      return { _type: 'BinarySwipeData' };

    case 'hangman':
    case 'pendu':
      return { _type: 'HangmanData' };

    case 'memory':
      return {
        config: { gridCols: 4, flipBackDelay: 1100 },
        pairs: items.map((item, idx) => ({
          id: item.id || String(idx),
          cardA: { text: item.payload.question || item.payload.translation || "Question" },
          cardB: { text: item.payload.answer || "Réponse" }
        }))
      };

    case 'anagram':
      return {
        words: items.map((item) => ({
          word: (item.payload.answer || item.id).toUpperCase(),
          hint: item.payload.question || item.payload.translation || ''
        }))
      };

    case 'category_blaster':
      return {
        config: { baseTimeMs: 3500, speedupFactor: 0.92, minTimeMs: 1200, comboBonus: true },
        categories: [
          { id: 'c1', label: 'Mot', emoji: '📝', color: '#6366f1' },
          { id: 'c2', label: 'Verbe', emoji: '🏃', color: '#f59e0b' }
        ],
        items: items.map((item, idx) => ({
          id: item.id || `item_${idx}`,
          text: item.payload.answer || item.payload.question || item.id,
          categoryId: (item.tags as string[])?.includes('verbe') ? 'c2' : 'c1'
        }))
      };

    case 'word_search':
      return {
        config: { gridSize: 10, hintMode: 'hint' },
        words: items.map(item => ({
          id: item.id,
          word: (item.payload.answer || item.payload.question || '').replace(/[^a-zA-Z]/g, '').toUpperCase(),
          hint: item.payload.translation || item.payload.question || item.payload.answer
        })).filter(w => w.word.length > 2 && w.word.length <= 10).slice(0, 6)
      };

    case 'fill_in_the_blank':
      return {
        exercises: items.map(item => {
          const q = item.payload.question || item.payload.translation || "";
          const text = q.includes('[1]') ? q : (q + " [1]");
          return {
            text,
            blanks: [{ id: '1', answer: item.payload.answer }]
          };
        })
      };

    case 'sequencing':
      return {
        config: { showLabels: true },
        items: items.map((it, index) => ({
          id: it.id,
          text: it.payload.answer || it.payload.question || it.id,
          label: it.payload.translation || '',
          order: index + 1
        }))
      };

    case 'drag_drop':
      {
        const uniqueAnswers = [...new Set(items.map(i => i.payload.answer))].filter(Boolean);
        const colors = ['#2D7A4F', '#c0392b', '#2980b9', '#f39c12', '#8e44ad'];
        
        return {
          config: { validateMode: 'immediate' },
          groups: uniqueAnswers.map((ans, idx) => ({
            id: ans,
            label: ans,
            emoji: '📁',
            color: colors[idx % colors.length]
          })),
          items: items.map(item => ({
            id: item.id,
            groupId: item.payload.answer,
            text: item.payload.question || item.payload.translation || item.payload.answer || item.id
          }))
        };
      }

    case 'line_matching':
      return {
        config: { shuffleRight: true },
        pairs: items.map((it) => ({
          id: it.id,
          left: { text: it.payload.question || it.payload.translation || it.id },
          right: { text: it.payload.answer || '' }
        }))
      };

    case 'bingo':
      return {
        config: { gridSize: 3, callerMode: 'auto', callerInterval: 5000 },
        items: items.map(it => ({
          id: it.id,
          term: it.payload.answer || it.payload.question || it.id,
          clue: it.payload.translation || it.payload.question || it.payload.answer || ''
        }))
      };

    case 'situational_choice':
      return {
        scenarios: items.map(it => ({
          id: it.id,
          situation: it.payload.question || it.id,
          question: 'Que dites-vous ?',
          choices: [
            { id: '1', text: it.payload.answer || '...', register: 'casual', correct: true, feedback: 'Correct !' },
            { id: '2', text: it.payload.translation || 'Autre option', register: 'formal', correct: false, feedback: 'Incorrect' }
          ]
        }))
      };

    case 'tile_merge':
      return {
        config: { gridSize: 4 },
        tileBank: items.slice(0, 8).flatMap((item, idx) => [
          { id: `t_${idx}_A`, label: item.payload.question || item.payload.translation || item.id, pairId: `t_${idx}_B`, sourceId: item.id },
          { id: `t_${idx}_B`, label: item.payload.answer || '?', pairId: `t_${idx}_A`, sourceId: item.id }
        ])
      };

    case 'chain_reaction':
      return {
        config: { timerSeconds: 8 },
        wordBank: items.map(item => {
          const word = (item.payload.answer || item.payload.question || item.id).replace(/[^a-zA-Z]/g, '').toUpperCase();
          return {
            id: item.id,
            word,
            startLetter: word[0],
            endLetter: word[word.length - 1]
          };
        }).filter(w => w.word.length >= 2)
      };
    case 'combination_builder':
      return {
        config: { maxSpins: 3 },
        reels: [
          { id: 'r1', items: ['P', 'T', 'C', 'M', 'B'] },
          { id: 'r2', items: ['A', 'O', 'I', 'E', 'U'] },
          { id: 'r3', items: ['T', 'M', 'L', 'R', 'S'] }
        ],
        validCombinations: [
          { result: 'PAT', combo: ['P', 'A', 'T'], definition: 'Action de...', points: 50 },
          { result: 'COL', combo: ['C', 'O', 'L'], definition: 'Partie d\'un vêtement', points: 60 },
          { result: 'MUR', combo: ['M', 'U', 'R'], definition: 'Paroi vertical', points: 70 }
        ]
      };

    case 'dialogue_tree':
      return {
        config: { character: { name: 'PNJ', avatar: '🤖' } },
        startNode: 'n1',
        nodes: {
          n1: { 
            npc: items?.[0]?.payload?.question || "Bonjour !", 
            choices: [ 
              { text: items?.[0]?.payload?.answer || "Salut", next: 'end_win', points: 10 }, 
              { text: items?.[0]?.payload?.translation || "...", next: 'end_neutral' } 
            ] 
          },
          end_win: { isEnd: true, npc: "Super", outcome: 'win' },
          end_neutral: { isEnd: true, npc: "Ok", outcome: 'neutral' }
        }
      };

    case 'rebus_puzzle':
      return {
        config: { hintLevel: 1 },
        puzzles: items.map(item => ({
          itemId: item.id,
          answer: item.payload.answer || item.payload.question,
          pieces: [ { emoji: '🧩', sound: '...' } ],
          choices: [item.payload.answer || item.payload.question, 'Autre'],
          explanation: item.payload.translation || ''
        }))
      };

    case 'audio_transcription':
      return {
        config: { maxReplays: 3, tolerance: 1, hint: 'word_count' },
        items: items.map((item) => ({
          itemId: item.id,
          expected: item.payload.answer || item.payload.question || '',
          audioUrl: '',
          points: 10,
          normalize: true
        }))
      };

    case 'error_correction':
      return {
        config: { showErrorCount: true },
        exercises: items.map((item, i) => ({
          itemId: item.id,
          text: item.payload.question || item.payload.translation || "Ceci est un texte avec une érreur.",
          errors: [{ id: `e${i}`, start: 29, end: 35, wrong: "érreur", correct: item.payload.answer || "erreur", explanation: "Pas d'accent ici." }]
        }))
      };

    case 'deceptive_pairs':
      return {
        config: { contextA: "FR (France)", contextB: "QC (Québec)" },
        pairs: items.map((item, j) => ({
          itemId: item.id,
          term: item.payload.question || item.payload.answer || "gosses",
          meaningA: "enfants",
          etymology: "",
          choices: [
            { id: "c1", text: item.payload.translation || "testicules", correct: true },
            { id: "c2", text: "enfants", correct: false, isMeaningA: true }
          ],
          explanation: "Les faux amis sont des mots identiques qui ont un sens différent."
        }))
      };

    case 'diagram_labeling':
      return {
        config: { tolerancePct: 6 },
        labels: items.map((item, i) => ({
          id: item.id || `l${i}`,
          itemId: item.id,
          text: item.payload.answer || item.payload.question || `Label ${i+1}`,
          zone: { x: 40 + i*5, y: 40 + i*5, width: 10, height: 10 }
        }))
      };

    case 'voice_recording':
      return {
        config: { maxAttempts: 3 },
        items: items.map((item) => ({
          itemId: item.id,
          text: item.payload.question || item.payload.answer || "Enregistrez votre voix",
          difficulty: 1,
          referenceAudio: item.payload.audioUrl || ""
        }))
      };

    case 'audio_ab':
      return {
        config: { criterion: "Laquelle sonne le plus naturel ?" },
        pairs: items.map((item) => ({
          itemId: item.id,
          label: item.payload.question || item.payload.answer || "Écoutez et comparez",
          audioA: (item.payload as any).audioA || "",
          audioB: (item.payload as any).audioB || "",
          correct: 'A' as const,
          explanation: item.payload.translation || "A est meilleur."
        }))
      };
  }
}
