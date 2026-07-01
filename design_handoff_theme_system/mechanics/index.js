/**
 * mechanics/index.js — Registre des 25 mécaniques de jeux pédagogiques
 *
 * Chaque mécanique est un composant React autonome.
 * Props communes : { data, onBack, onComplete(score) }
 * Données : passer le JSON conforme au schéma du catalogue (Moteur Jeux Pedagogiques.dc.html)
 *
 * Usage :
 *   import FlashcardSRS from './mechanics/01_FlashcardSRS';
 *   <FlashcardSRS data={myData} onBack={() => nav.goBack()} onComplete={(pts) => addScore(pts)} />
 */

export { default as FlashcardSRS }        from './01_FlashcardSRS';
export { default as MultipleChoice }       from './02_MultipleChoice';
export { default as BinarySwipe }          from './03_BinarySwipe';
export { default as MemoryMatch }          from './04_MemoryMatch';
export { default as Hangman }              from './05_Hangman';
export { default as Anagram }              from './06_Anagram';
export { default as ClozeTest }            from './07_ClozeTest';
export { default as Sequencing }           from './08_Sequencing';
export { default as SortGroup }            from './09_SortGroup';
export { default as LineMatching }         from './10_LineMatching';
export { default as Bingo }               from './11_Bingo';
export { default as SituationalChoice }    from './12_SituationalChoice';
export { default as CategoryBlaster }      from './13_CategoryBlaster';
export { default as TileMerge }           from './14_TileMerge';
export { default as WordSearch }          from './15_WordSearch';
export { default as ChainReaction }        from './16_ChainReaction';
export { default as CombinationBuilder }   from './17_CombinationBuilder';
export { default as DialogueTree }         from './18_DialogueTree';
export { default as RebusPuzzle }         from './19_RebusPuzzle';
export { default as AudioTranscription }   from './20_AudioTranscription';
export { default as ErrorCorrection }      from './21_ErrorCorrection';
export { default as DeceptivePairs }       from './22_DeceptivePairs';
export { default as DiagramLabeling }      from './23_DiagramLabeling';
export { default as VoiceRecording }       from './24_VoiceRecording';
export { default as AudioAB }             from './25_AudioAB';

/**
 * REGISTRY — Méta-données pour navigation dynamique
 *
 * Utilise MECHANICS_REGISTRY pour construire un sélecteur de jeu,
 * filtrer par catégorie, ou mapper un type JSON vers son composant.
 */
export const MECHANICS_REGISTRY = [
  { id:'flashcard_srs',      name:'Flashcard SRS',           component:'FlashcardSRS',       cat:'vocab',    icon:'🃏', complexity:1 },
  { id:'multiple_choice',    name:'Quiz Choix Multiple',      component:'MultipleChoice',      cat:'sort',     icon:'🎯', complexity:1 },
  { id:'binary_swipe',       name:'Swipe Binaire',            component:'BinarySwipe',         cat:'sort',     icon:'⬅️➡️', complexity:1 },
  { id:'memory_match',       name:'Memory Match',             component:'MemoryMatch',         cat:'visual',   icon:'🃏', complexity:1 },
  { id:'hangman',            name:'Devinette par Lettres',    component:'Hangman',             cat:'vocab',    icon:'🪢', complexity:1 },
  { id:'anagram',            name:'Anagramme',                component:'Anagram',             cat:'vocab',    icon:'🔤', complexity:1 },
  { id:'cloze',              name:'Texte à Trous',            component:'ClozeTest',           cat:'vocab',    icon:'📝', complexity:2 },
  { id:'sequencing',         name:'Séquençage',               component:'Sequencing',          cat:'sort',     icon:'📅', complexity:2 },
  { id:'sort_group',         name:'Tri par Groupes',          component:'SortGroup',           cat:'sort',     icon:'🗂️', complexity:2 },
  { id:'line_matching',      name:'Association par Lignes',   component:'LineMatching',        cat:'sort',     icon:'🔗', complexity:1 },
  { id:'bingo',              name:'Bingo Pédagogique',        component:'Bingo',               cat:'social',   icon:'🎱', complexity:2 },
  { id:'situational_choice', name:'Choix Situationnel',       component:'SituationalChoice',   cat:'social',   icon:'🎭', complexity:2 },
  { id:'category_blaster',   name:'Catégorisation Rapide',    component:'CategoryBlaster',     cat:'visual',   icon:'🏒', complexity:2 },
  { id:'tile_merge',         name:'Fusion de Tuiles',         component:'TileMerge',           cat:'visual',   icon:'🔢', complexity:3 },
  { id:'word_search',        name:'Mots Cachés',              component:'WordSearch',          cat:'vocab',    icon:'🔍', complexity:1 },
  { id:'chain_reaction',     name:'Chaîne de Mots',           component:'ChainReaction',       cat:'vocab',    icon:'⛓️', complexity:3 },
  { id:'combination',        name:'Constructeur de Combos',   component:'CombinationBuilder',  cat:'vocab',    icon:'🎰', complexity:2 },
  { id:'dialogue_tree',      name:'Arbre de Dialogue',        component:'DialogueTree',        cat:'social',   icon:'💬', complexity:3 },
  { id:'rebus',              name:'Rébus Visuel',             component:'RebusPuzzle',         cat:'visual',   icon:'🧩', complexity:3 },
  { id:'audio_transcription',name:'Dictée Audio',             component:'AudioTranscription',  cat:'audio',    icon:'🎙️', complexity:2 },
  { id:'error_correction',   name:'Correction d'Erreurs',    component:'ErrorCorrection',     cat:'vocab',    icon:'🔎', complexity:3 },
  { id:'deceptive_pairs',    name:'Faux Amis',                component:'DeceptivePairs',      cat:'vocab',    icon:'🤥', complexity:2 },
  { id:'diagram_labeling',   name:'Étiquetage de Schéma',     component:'DiagramLabeling',     cat:'visual',   icon:'🗺️', complexity:2 },
  { id:'voice_recording',    name:'Enregistrement Vocal',     component:'VoiceRecording',      cat:'audio',    icon:'🎤', complexity:3 },
  { id:'audio_ab',           name:'Comparaison Audio A/B',    component:'AudioAB',             cat:'audio',    icon:'👂', complexity:1 },
];