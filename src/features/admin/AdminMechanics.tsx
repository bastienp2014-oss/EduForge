import React, { useState } from 'react';
import { useGames } from '../../store/useGames';
import { Plus, ArrowLeft, Save, X } from 'lucide-react';
import { useAdminTheme } from '../../store/useAdminTheme';

const CATS = [
  { id: 'tous',   emoji: '🎮', label: 'Toutes'          },
  { id: 'vocab',  emoji: '📝', label: 'Texte & Vocab'   },
  { id: 'audio',  emoji: '🎧', label: 'Audio'           },
  { id: 'visual', emoji: '👁️', label: 'Visuel & Logique' },
  { id: 'social', emoji: '💬', label: 'Conversation'    },
  { id: 'sort',   emoji: '🎯', label: 'Tri & Classement' },
];

const MECHS = [
  {
    id: '01_FlashcardSRS',
    icon: '🃏',
    name: 'Flashcard SRS',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#6366f1',
    iconBg: 'rgba(99,102,241,.2)',
    blurb: 'Révision espacée adaptative. Le classique.',
    tags: ['texte', 'image', 'audio'],
    complexity: 'Simple',
    dots: [{ color: '#6366f1' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Affichage simple d\'un stimulus (texte, image, son) et d\'une réponse cachée. Utilise l\'algorithme SuperMemo2 pour espacer les révisions.',
    params: [
      { icon: '⏱️', name: 'Auto-flip', desc: 'Retourne la carte automatiquement' },
      { icon: '🔊', name: 'Auto-play Audio', desc: 'Joue le son à l\'ouverture' }
    ],
    domains: [
      { icon: '🇯🇵', label: 'Langues', example: 'Kanji / Sens' },
      { icon: '🌍', label: 'Géo', example: 'Capitale / Pays' }
    ],
    schema: '{\n  "cards": [\n    {\n      "front": "Bonjour",\n      "back": "Hello"\n    }\n  ]\n}',
    fields: [
      { key: 'cards[].front', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Question / stimulus' },
      { key: 'cards[].back', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Réponse' }
    ],
    exampleDomain: '🇬🇧 Anglais',
    example: '{\n  "cards": [\n    { "front": "Chat", "back": "Cat" }\n  ]\n}',
    notes: [{ icon: '💡', text: 'Ne pas oublier d\'activer l\'audio si des fichiers sonores sont présents.' }]
  },
  {
    id: '02_MultipleChoice',
    icon: '🎯',
    name: 'Quiz Choix Multiple',
    cat: 'sort',
    catLabel: 'Tri & Classement',
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,.2)',
    blurb: 'Question + 4 choix de réponse.',
    tags: ['texte', 'image'],
    complexity: 'Simple',
    dots: [{ color: '#f59e0b' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Le format classique de QCM. Idéal pour vérifier les connaissances factuelles de manière directe.',
    params: [{ icon: '🔀', name: 'Aléatoire', desc: 'Mélange l\'ordre des options' }],
    domains: [{ icon: '🔬', label: 'Sciences', example: 'Formules / Molécules' }],
    schema: '{\n  "questions": [\n    {\n      "q": "Capitale ?",\n      "options": ["A", "B"],\n      "answer": 0\n    }\n  ]\n}',
    fields: [
      { key: 'questions[].q', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La question posée' },
      { key: 'questions[].answer', type: 'number', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Index de la bonne réponse (0-based)' }
    ],
    exampleDomain: '🧪 Chimie',
    example: '{\n  "questions": [{ "q": "Symbole de l\'eau", "options": ["H2O", "CO2"], "answer": 0 }]\n}',
    notes: [{ icon: 'ℹ️', text: 'Garder les options courtes pour l\'affichage mobile.' }]
  },
  {
    id: '03_BinarySwipe',
    icon: '👈',
    name: 'Swipe Binaire',
    cat: 'sort',
    catLabel: 'Tri & Classement',
    accent: '#ec4899',
    iconBg: 'rgba(236,72,153,.2)',
    blurb: 'Swipe gauche ou droite (Vrai/Faux, etc.).',
    tags: ['texte', 'image', 'binaire'],
    complexity: 'Simple',
    dots: [{ color: '#ec4899' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Tri rapide par gestes. L\'utilisateur glisse une carte vers la gauche ou la droite pour la classer dans l\'une des deux catégories.',
    params: [{ icon: '🎨', name: 'Couleurs', desc: 'Couleurs des zones de drop' }],
    domains: [{ icon: '🍏', label: 'Nutrition', example: 'Sain / Malsain' }],
    schema: '{\n  "leftCategory": "Vrai",\n  "rightCategory": "Faux",\n  "items": [\n    { "text": "Le ciel est bleu", "correct": "left" }\n  ]\n}',
    fields: [
      { key: 'items[].correct', type: '"left"|"right"', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La direction correcte' }
    ],
    exampleDomain: '✅ Vrai ou Faux',
    example: '{\n  "leftCategory": "Vrai",\n  "rightCategory": "Faux",\n  "items": [{ "text": "Le soleil est chaud", "correct": "left" }]\n}',
    notes: [{ icon: '📱', text: 'Très engageant sur mobile.' }]
  },
  {
    id: '09_SortGroup',
    icon: '🗂️',
    name: 'Tri par Groupes',
    cat: 'sort',
    catLabel: 'Tri & Classement',
    accent: '#3b82f6',
    iconBg: 'rgba(59,130,246,.2)',
    blurb: 'Dépose les items dans les catégories.',
    tags: ['texte', 'image', 'drag & drop'],
    complexity: 'Moyen',
    dots: [{ color: '#3b82f6' }, { color: '#3b82f6' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'L\'utilisateur doit glisser-déposer des éléments dans plusieurs boîtes/catégories définies à l\'avance.',
    params: [{ icon: '📥', name: 'Boîtes max', desc: 'Idéalement 3 ou 4 catégories' }],
    domains: [{ icon: '🐾', label: 'Biologie', example: 'Mammifères / Reptiles / Oiseaux' }],
    schema: '{\n  "categories": ["Mammifère", "Oiseau"],\n  "items": [\n    { "text": "Chien", "catIndex": 0 }\n  ]\n}',
    fields: [{ key: 'items[].catIndex', type: 'number', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'L\'index de la catégorie' }],
    exampleDomain: 'Biologie',
    example: '{\n  "categories": ["Mammifère", "Oiseau"],\n  "items": [{ "text": "Chat", "catIndex": 0 }, { "text": "Aigle", "catIndex": 1 }]\n}',
    notes: [{ icon: '⚠️', text: 'Au-delà de 4 catégories, l\'écran devient chargé.' }]
  },
  {
    id: '26_WordGrid',
    icon: '🧩',
    name: 'Grille de Mots Cachés',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#8b5cf6',
    iconBg: 'rgba(139,92,246,.2)',
    blurb: 'Trouve les mots cachés dans la grille.',
    tags: ['texte', 'grille'],
    complexity: 'Moyen',
    dots: [{ color: '#8b5cf6' }, { color: '#8b5cf6' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Une grille de lettres contenant des mots cachés. L\'utilisateur glisse son doigt pour sélectionner les mots.',
    params: [{ icon: '📏', name: 'Taille', desc: 'Taille de la grille (ex: 8x8)' }],
    domains: [{ icon: '📚', label: 'Vocabulaire', example: 'Les couleurs' }],
    schema: '{\n  "words": ["ROUGE", "BLEU", "VERT"],\n  "gridSize": 8\n}',
    fields: [{ key: 'words', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Liste des mots à trouver' }],
    exampleDomain: 'Les Couleurs',
    example: '{\n  "words": ["ROUGE", "BLEU"],\n  "gridSize": 6\n}',
    notes: [{ icon: '⚡', text: 'Généré automatiquement par le moteur.' }]
  },
  {
    id: '18_DialogueTree',
    icon: '💬',
    name: 'Arbre de Dialogue',
    cat: 'social',
    catLabel: 'Conversation',
    accent: '#10b981',
    iconBg: 'rgba(16,185,129,.2)',
    blurb: 'Un PNJ lance une conversation à choix.',
    tags: ['texte', 'audio', 'scénario'],
    complexity: 'Complexe',
    dots: [{ color: '#10b981' }, { color: '#10b981' }, { color: '#10b981' }],
    longDesc: 'Simulation de discussion où chaque choix influence la réplique suivante du personnage.',
    params: [{ icon: '👤', name: 'Avatar', desc: 'Image du PNJ' }],
    domains: [{ icon: '🥖', label: 'Langues', example: 'Commander au restaurant' }],
    schema: '{\n  "nodes": [\n    {\n      "id": "start",\n      "text": "Bonjour !",\n      "choices": [{ "text": "Salut", "next": "end" }]\n    }\n  ]\n}',
    fields: [{ key: 'nodes[].choices[].next', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'ID du noeud suivant' }],
    exampleDomain: 'Restaurant',
    example: '{\n  "nodes": [{ "id": "start", "text": "Une table pour 2 ?", "choices": [{ "text": "Oui s\'il vous plaît.", "next": "table" }] }]\n}',
    notes: [{ icon: '🕸️', text: 'Attention aux boucles infinies !' }]
  },
  {
    id: '12_SituationalChoice',
    icon: '🎭',
    name: 'Choix Situationnel',
    cat: 'social',
    catLabel: 'Conversation',
    accent: '#14b8a6',
    iconBg: 'rgba(20,184,166,.2)',
    blurb: 'Une scène du quotidien, que faire ?',
    tags: ['texte', 'image', 'contexte'],
    complexity: 'Moyen',
    dots: [{ color: '#14b8a6' }, { color: '#14b8a6' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Une image ou une vidéo pose un contexte. L\'utilisateur doit choisir la meilleure réaction.',
    params: [{ icon: '🖼️', name: 'Média', desc: 'Image ou vidéo obligatoire' }],
    domains: [{ icon: '🚑', label: 'Urgence', example: 'Que faire face à un feu' }],
    schema: '{\n  "scenario": "Le feu se déclare",\n  "options": ["Crier", "Appeler les pompiers"],\n  "best": 1\n}',
    fields: [{ key: 'best', type: 'number', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Index de la meilleure option' }],
    exampleDomain: 'Premiers Soins',
    example: '{\n  "scenario": "Une personne s\'étouffe",\n  "options": ["Méthode Heimlich", "Donner de l\'eau"],\n  "best": 0\n}',
    notes: [{ icon: '💡', text: 'Ajouter des explications post-choix aide beaucoup.' }]
  },
  {
    id: '20_AudioTranscription',
    icon: '📝',
    name: 'Dictée Audio',
    cat: 'audio',
    catLabel: 'Audio & Parole',
    accent: '#a855f7',
    iconBg: 'rgba(168,85,247,.2)',
    blurb: 'Écoute un clip audio, transcris-le.',
    tags: ['audio', 'texte', 'saisie'],
    complexity: 'Moyen',
    dots: [{ color: '#a855f7' }, { color: '#a855f7' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Travaille la compréhension orale et l\'orthographe.',
    params: [{ icon: '🎚️', name: 'Vitesse', desc: 'Possibilité de ralentir l\'audio' }],
    domains: [{ icon: '🗣️', label: 'Langues', example: 'Dictée d\'espagnol' }],
    schema: '{\n  "clips": [\n    { "url": "audio.mp3", "transcript": "Hola" }\n  ]\n}',
    fields: [{ key: 'clips[].transcript', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La transcription exacte attendue' }],
    exampleDomain: 'Espagnol',
    example: '{\n  "clips": [{ "url": "hola.mp3", "transcript": "Hola amigo" }]\n}',
    notes: [{ icon: '⌨️', text: 'Tolérer la casse et la ponctuation si possible.' }]
  },
  {
    id: '19_RebusPuzzle',
    icon: '🕵️',
    name: 'Rébus Visuel',
    cat: 'visual',
    catLabel: 'Visuel & Logique',
    accent: '#f43f5e',
    iconBg: 'rgba(244,63,94,.2)',
    blurb: 'Des images/emojis combinés pour former un mot.',
    tags: ['image', 'emoji', 'phonétique'],
    complexity: 'Simple',
    dots: [{ color: '#f43f5e' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'L\'utilisateur doit deviner un mot à partir d\'une séquence d\'images (ex: Chat + Pot = Chapeau).',
    params: [{ icon: '⌨️', name: 'Saisie', desc: 'Lettres brouillées ou clavier' }],
    domains: [{ icon: '🧒', label: 'Jeunesse', example: 'Jeux de mots' }],
    schema: '{\n  "rebus": ["🐱", "🍯"],\n  "answer": "Chapeau"\n}',
    fields: [{ key: 'answer', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La réponse finale' }],
    exampleDomain: 'Culture G',
    example: '{\n  "rebus": ["👁️", "🌊"],\n  "answer": "Océan"\n}',
    notes: [{ icon: '😄', text: 'Très fun pour casser la routine.' }]
  },
  {
    id: '25_AudioAB',
    icon: '🎧',
    name: 'Comparaison Audio A/B',
    cat: 'audio',
    catLabel: 'Audio & Parole',
    accent: '#818cf8',
    iconBg: 'rgba(129,140,248,.2)',
    blurb: 'Deux clips audio, identifie le bon.',
    tags: ['audio', 'choix binaire'],
    complexity: 'Simple',
    dots: [{ color: '#818cf8' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Permet de travailler la discrimination phonétique.',
    params: [{ icon: '🔁', name: 'Replay', desc: 'Autoriser la réécoute' }],
    domains: [{ icon: '🗣️', label: 'Prononciation', example: 'Accents' }],
    schema: '{\n  "pairs": [{ "audioA": "1.mp3", "audioB": "2.mp3", "correct": "A" }]\n}',
    fields: [{ key: 'correct', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Le bon choix (A ou B)' }],
    exampleDomain: 'Phonétique',
    example: '{\n  "pairs": [{ "audioA": "ship.mp3", "audioB": "sheep.mp3", "correct": "B" }]\n}',
    notes: [{ icon: '🔈', text: 'Excellente mécanique pour l\'apprentissage des langues.' }]
  },
  {
    id: '11_Bingo',
    icon: '🎱',
    name: 'Bingo Pédagogique',
    cat: 'social',
    catLabel: 'Conversation',
    accent: '#34d399',
    iconBg: 'rgba(52,211,153,.2)',
    blurb: 'Grille NxN de termes.',
    tags: ['texte', 'multijoueur', 'grille'],
    complexity: 'Moyen',
    dots: [{ color: '#34d399' }, { color: '#34d399' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'L\'animateur tire des concepts, l\'apprenant doit les retrouver sur sa carte.',
    params: [{ icon: '📏', name: 'Taille', desc: 'Taille de la grille (3x3, 4x4)' }],
    domains: [{ icon: '🏫', label: 'Classe', example: 'Révision collective' }],
    schema: '{\n  "terms": ["Concept A", "Concept B"]\n}',
    fields: [{ key: 'terms', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Les termes du bingo' }],
    exampleDomain: 'Révision',
    example: '{\n  "terms": ["Addition", "Soustraction"]\n}',
    notes: [{ icon: '🎉', text: 'Favorise l\'engagement social.' }]
  },
  {
    id: '22_DeceptivePairs',
    icon: '🎭',
    name: 'Faux Amis',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#fbbf24',
    iconBg: 'rgba(251,191,36,.2)',
    blurb: 'Deux mots semblent identiques.',
    tags: ['texte', 'contexte', 'piège'],
    complexity: 'Moyen',
    dots: [{ color: '#fbbf24' }, { color: '#fbbf24' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Distinguer des concepts très similaires ou des pièges linguistiques.',
    params: [{ icon: '⏳', name: 'Temps', desc: 'Limite de temps courte' }],
    domains: [{ icon: '🇪🇸', label: 'Langues', example: 'Faux amis' }],
    schema: '{\n  "pairs": [{ "term": "Library", "meaning": "Bibliothèque" }]\n}',
    fields: [{ key: 'meaning', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La vraie signification' }],
    exampleDomain: 'Anglais',
    example: '{\n  "pairs": [{ "term": "Actually", "meaning": "En fait" }]\n}',
    notes: [{ icon: '⚠️', text: 'Ne pas utiliser trop souvent pour ne pas frustrer.' }]
  },
  {
    id: '16_ChainReaction',
    icon: '🔗',
    name: 'Chaîne de Mots',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#60a5fa',
    iconBg: 'rgba(96,165,250,.2)',
    blurb: 'La dernière syllabe d\'un mot...',
    tags: ['texte', 'phonétique', 'endurance'],
    complexity: 'Complexe',
    dots: [{ color: '#60a5fa' }, { color: '#60a5fa' }, { color: '#60a5fa' }],
    longDesc: 'Chaque réponse doit commencer par la fin du mot précédent.',
    params: [{ icon: '🔤', name: 'Lettres', desc: 'Nombre de lettres à reprendre' }],
    domains: [{ icon: '🇯🇵', label: 'Japonais', example: 'Shiritori' }],
    schema: '{\n  "startWord": "Chapeau",\n  "validWords": ["Poteau", "Auto"]\n}',
    fields: [{ key: 'validWords', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Dictionnaire des mots valides' }],
    exampleDomain: 'Jeux de Mots',
    example: '{\n  "startWord": "Chat",\n  "validWords": ["Chapeau", "Peau"]\n}',
    notes: [{ icon: '🧠', text: 'Requiert un gros dictionnaire.' }]
  },
  {
    id: '17_CombinationBuilder',
    icon: '🎰',
    name: 'Constructeur',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#c084fc',
    iconBg: 'rgba(192,132,252,.2)',
    blurb: 'Plusieurs rouleaux de syllabes.',
    tags: ['texte', 'syllabes', 'hasard'],
    complexity: 'Moyen',
    dots: [{ color: '#c084fc' }, { color: '#c084fc' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Construire des mots en alignant des préfixes, racines et suffixes.',
    params: [{ icon: '🔄', name: 'Rouleaux', desc: 'Nombre de segments' }],
    domains: [{ icon: '📖', label: 'Grammaire', example: 'Préfixes / Suffixes' }],
    schema: '{\n  "prefixes": ["Re", "Pre"],\n  "roots": ["faire", "voir"]\n}',
    fields: [{ key: 'roots', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Les racines de mots' }],
    exampleDomain: 'Grammaire',
    example: '{\n  "prefixes": ["In"],\n  "roots": ["Croyable"]\n}',
    notes: [{ icon: '🎯', text: 'Permet de comprendre la structure des mots.' }]
  },
  {
    id: '15_WordSearch',
    icon: '🔍',
    name: 'Devinette par Lettres',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#fb923c',
    iconBg: 'rgba(251,146,60,.2)',
    blurb: 'Découvre le mot caché.',
    tags: ['texte', 'lettres', 'déduction'],
    complexity: 'Simple',
    dots: [{ color: '#fb923c' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Deviner un mot lettre par lettre avec un indice.',
    params: [{ icon: '💡', name: 'Indices', desc: 'Nombre d\'indices dispo' }],
    domains: [{ icon: '❓', label: 'Culture G', example: 'Devinettes' }],
    schema: '{\n  "word": "Pomme",\n  "clue": "Fruit rouge ou vert"\n}',
    fields: [{ key: 'word', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Le mot à deviner' }],
    exampleDomain: 'Vocabulaire',
    example: '{\n  "word": "Chien",\n  "clue": "Meilleur ami de l\'homme"\n}',
    notes: [{ icon: '🎮', text: 'Similaire au jeu du pendu.' }]
  },
  {
    id: '13_CategoryBlaster',
    icon: '🚀',
    name: 'Catégorisation Rapide',
    cat: 'visual',
    catLabel: 'Visuel & Logique',
    accent: '#ef4444',
    iconBg: 'rgba(239,68,68,.2)',
    blurb: 'Des items arrivent rapidement.',
    tags: ['texte', 'image', 'vitesse'],
    complexity: 'Moyen',
    dots: [{ color: '#ef4444' }, { color: '#ef4444' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Détruire les items qui n\'appartiennent pas à la bonne catégorie.',
    params: [{ icon: '⚡', name: 'Vitesse', desc: 'Vitesse de chute des objets' }],
    domains: [{ icon: '🧮', label: 'Maths', example: 'Nombres pairs' }],
    schema: '{\n  "target": "Pair",\n  "items": [{ "val": "2", "isTarget": true }]\n}',
    fields: [{ key: 'isTarget', type: 'boolean', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Fait-il partie de la catégorie ?' }],
    exampleDomain: 'Mathématiques',
    example: '{\n  "target": "Pair",\n  "items": [{ "val": "2", "isTarget": true }, { "val": "3", "isTarget": false }]\n}',
    notes: [{ icon: '🕹️', text: 'Mécanique très gamifiée.' }]
  },
  {
    id: '04_MemoryMatch',
    icon: '🧠',
    name: 'Memory Match',
    cat: 'visual',
    catLabel: 'Visuel & Logique',
    accent: '#4ade80',
    iconBg: 'rgba(74,222,128,.2)',
    blurb: 'Retourne des paires.',
    tags: ['image', 'texte', 'mémorisation'],
    complexity: 'Simple',
    dots: [{ color: '#4ade80' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Trouver les paires correspondantes cachées face vers le bas.',
    params: [{ icon: '⏱️', name: 'Temps', desc: 'Mode Contre-la-montre' }],
    domains: [{ icon: '🐼', label: 'Langues', example: 'Mot / Image' }],
    schema: '{\n  "pairs": [{ "item1": "Dog", "item2": "Chien" }]\n}',
    fields: [{ key: 'pairs', type: 'array', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Les paires à faire correspondre' }],
    exampleDomain: 'Vocabulaire',
    example: '{\n  "pairs": [{ "item1": "Cat", "item2": "Chat" }]\n}',
    notes: [{ icon: '👀', text: 'Entraîne la mémoire spatiale.' }]
  },
  {
    id: '07_ClozeTest',
    icon: '🕳️',
    name: 'Texte à Trous',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#94a3b8',
    iconBg: 'rgba(148,163,184,.2)',
    blurb: 'Un texte avec des mots masqués.',
    tags: ['texte', 'lecture', 'grammaire'],
    complexity: 'Moyen',
    dots: [{ color: '#94a3b8' }, { color: '#94a3b8' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Compléter les mots manquants dans une phrase.',
    params: [{ icon: '🔠', name: 'Banque', desc: 'Proposer une liste de mots ou saisie libre' }],
    domains: [{ icon: '📝', label: 'Grammaire', example: 'Conjugaison' }],
    schema: '{\n  "text": "Le chat _ la souris",\n  "blanks": ["mange"]\n}',
    fields: [{ key: 'blanks', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Les mots à insérer' }],
    exampleDomain: 'Grammaire',
    example: '{\n  "text": "Je _ grand.",\n  "blanks": ["suis"]\n}',
    notes: [{ icon: '✍️', text: 'Classique et efficace.' }]
  },
  {
    id: '06_Anagram',
    icon: '🌪️',
    name: 'Anagramme',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#facc15',
    iconBg: 'rgba(250,204,21,.2)',
    blurb: 'Des lettres mélangées.',
    tags: ['texte', 'lettres', 'orthographe'],
    complexity: 'Simple',
    dots: [{ color: '#facc15' }, { color: 'rgba(255,255,255,.15)' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Remettre les lettres dans l\'ordre pour former le mot.',
    params: [{ icon: '🔤', name: 'Majuscules', desc: 'Garder ou non la casse' }],
    domains: [{ icon: '✏️', label: 'Orthographe', example: 'Vocabulaire' }],
    schema: '{\n  "words": ["BONJOUR"]\n}',
    fields: [{ key: 'words', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Mots à mélanger' }],
    exampleDomain: 'Vocabulaire',
    example: '{\n  "words": ["CHAPEAU"]\n}',
    notes: [{ icon: '🔀', text: 'Génération automatique du mélange.' }]
  },
  {
    id: '21_ErrorCorrection',
    icon: '🖍️',
    name: 'Correction d\'Erreurs',
    cat: 'vocab',
    catLabel: 'Texte & Vocab',
    accent: '#ef4444',
    iconBg: 'rgba(239,68,68,.2)',
    blurb: 'Un texte contient des erreurs.',
    tags: ['texte', 'grammaire', 'esprit critique'],
    complexity: 'Complexe',
    dots: [{ color: '#ef4444' }, { color: '#ef4444' }, { color: '#ef4444' }],
    longDesc: 'Trouver et corriger les fautes volontairement insérées dans un texte.',
    params: [{ icon: '❌', name: 'Indiquer', desc: 'Souligner ou non les fautes' }],
    domains: [{ icon: '📖', label: 'Relecture', example: 'Grammaire' }],
    schema: '{\n  "text": "Ils mange une pomme.",\n  "errors": [{ "pos": 4, "len": 5, "correction": "mangent" }]\n}',
    fields: [{ key: 'errors[].correction', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'La correction attendue' }],
    exampleDomain: 'Grammaire',
    example: '{\n  "text": "Il est allez.",\n  "errors": [{ "pos": 7, "len": 5, "correction": "allé" }]\n}',
    notes: [{ icon: '👁️', text: 'Entraîne l\'œil aiguisé.' }]
  },
  {
    id: '08_Sequencing',
    icon: '🔢',
    name: 'Chronologie',
    cat: 'sort',
    catLabel: 'Tri & Classement',
    accent: '#06b6d4',
    iconBg: 'rgba(6,182,212,.2)',
    blurb: 'Remets des événements en ordre.',
    tags: ['texte', 'image', 'ordre', 'drag & drop'],
    complexity: 'Moyen',
    dots: [{ color: '#06b6d4' }, { color: '#06b6d4' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Glisser-déposer les éléments pour les remettre dans leur ordre logique ou chronologique.',
    params: [{ icon: '↕️', name: 'Axe', desc: 'Vertical ou Horizontal' }],
    domains: [{ icon: '⏳', label: 'Histoire', example: 'Dates historiques' }],
    schema: '{\n  "items": ["Début", "Milieu", "Fin"]\n}',
    fields: [{ key: 'items', type: 'string[]', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Liste ordonnée correcte' }],
    exampleDomain: 'Histoire',
    example: '{\n  "items": ["Antiquité", "Moyen-Âge", "Renaissance"]\n}',
    notes: [{ icon: '🧩', text: 'Le moteur mélange automatiquement.' }]
  },
  {
    id: '10_LineMatching',
    icon: '🪢',
    name: 'Association par Lignes',
    cat: 'sort',
    catLabel: 'Tri & Classement',
    accent: '#8b5cf6',
    iconBg: 'rgba(139,92,246,.2)',
    blurb: 'Relie chaque élément.',
    tags: ['texte', 'image', 'lignes', 'correspondance'],
    complexity: 'Moyen',
    dots: [{ color: '#8b5cf6' }, { color: '#8b5cf6' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Tracer des lignes entre les éléments de la colonne A et de la colonne B.',
    params: [{ icon: '〰️', name: 'Lignes', desc: 'Droites ou courbes' }],
    domains: [{ icon: '🔗', label: 'Vocabulaire', example: 'Synonymes' }],
    schema: '{\n  "pairs": [{ "left": "Grand", "right": "Petit" }]\n}',
    fields: [{ key: 'pairs', type: 'array', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Les paires correctes' }],
    exampleDomain: 'Antonymes',
    example: '{\n  "pairs": [{ "left": "Chaud", "right": "Froid" }]\n}',
    notes: [{ icon: '🖍️', text: 'Interaction tactile très satisfaisante.' }]
  },
  {
    id: '23_DiagramLabeling',
    icon: '📊',
    name: 'Étiquetage de Schéma',
    cat: 'visual',
    catLabel: 'Visuel & Logique',
    accent: '#14b8a6',
    iconBg: 'rgba(20,184,166,.2)',
    blurb: 'Un schéma / image s\'affiche.',
    tags: ['image', 'zones', 'STEM'],
    complexity: 'Complexe',
    dots: [{ color: '#14b8a6' }, { color: '#14b8a6' }, { color: '#14b8a6' }],
    longDesc: 'Placer des étiquettes de texte sur les bonnes zones d\'une image de fond.',
    params: [{ icon: '🎯', name: 'Précision', desc: 'Taille des zones de dépôt' }],
    domains: [{ icon: '🫀', label: 'Anatomie', example: 'Corps humain' }],
    schema: '{\n  "imageUrl": "coeur.png",\n  "labels": [{ "text": "Aorte", "x": 50, "y": 20 }]\n}',
    fields: [{ key: 'labels[].x', type: 'number', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Position % X' }],
    exampleDomain: 'Biologie',
    example: '{\n  "imageUrl": "cellule.png",\n  "labels": [{ "text": "Noyau", "x": 45, "y": 55 }]\n}',
    notes: [{ icon: '📐', text: 'Nécessite de préparer l\'image avec ses coordonnées.' }]
  },
  {
    id: '24_VoiceRecording',
    icon: '🎙️',
    name: 'Enregistrement Vocal',
    cat: 'audio',
    catLabel: 'Audio & Parole',
    accent: '#f43f5e',
    iconBg: 'rgba(244,63,94,.2)',
    blurb: 'Enregistre ta prononciation.',
    tags: ['audio', 'microphone', 'prononciation'],
    complexity: 'Complexe',
    dots: [{ color: '#f43f5e' }, { color: '#f43f5e' }, { color: '#f43f5e' }],
    longDesc: 'L\'utilisateur lit un texte à voix haute et l\'application analyse la prononciation (si API disponible).',
    params: [{ icon: '🤖', name: 'Analyse IA', desc: 'Evaluation automatique' }],
    domains: [{ icon: '🗣️', label: 'Phonétique', example: 'Répéter' }],
    schema: '{\n  "textToRead": "The quick brown fox"\n}',
    fields: [{ key: 'textToRead', type: 'string', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Le texte attendu' }],
    exampleDomain: 'Anglais',
    example: '{\n  "textToRead": "Hello world"\n}',
    notes: [{ icon: '🎤', text: 'Nécessite la permission du microphone.' }]
  },
  {
    id: '14_TileMerge',
    icon: '🔲',
    name: 'Fusion de Tuiles',
    cat: 'visual',
    catLabel: 'Visuel & Logique',
    accent: '#6366f1',
    iconBg: 'rgba(99,102,241,.2)',
    blurb: 'Variante de 2048.',
    tags: ['grille', 'texte', 'stratégie'],
    complexity: 'Moyen',
    dots: [{ color: '#6366f1' }, { color: '#6366f1' }, { color: 'rgba(255,255,255,.15)' }],
    longDesc: 'Glisser pour fusionner des concepts (ex: Eau + Froid = Glace).',
    params: [{ icon: '🧩', name: 'Combinaisons', desc: 'Arbre d\'évolution' }],
    domains: [{ icon: '🧪', label: 'Chimie', example: 'Éléments' }],
    schema: '{\n  "merges": [{ "in1": "Eau", "in2": "Froid", "out": "Glace" }]\n}',
    fields: [{ key: 'merges', type: 'array', required: 'REQ', badgeBg: '#ef4444', badgeFg: '#fff', desc: 'Règles de fusion' }],
    exampleDomain: 'Sciences',
    example: '{\n  "merges": [{ "in1": "H", "in2": "O", "out": "Eau" }]\n}',
    notes: [{ icon: '🎮', text: 'Très addictif mais dur à créer en termes de contenu.' }]
  }
];

export default function AdminMechanics() {
  const { theme } = useAdminTheme();
  
  const [activeCat, setActiveCat] = useState('tous');
  const [openMech, setOpenMech] = useState<typeof MECHS[0] | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  
  const addGame = useGames(s => s.addGame);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '🎮',
    description: '',
    tags: '',
  });

  const handleSelect = (m: typeof MECHS[0]) => {
    setOpenMech(m);
    setDetailTab('overview');
    setFormData({
      id: `${m.id.toLowerCase()}_${Date.now()}`,
      name: `Nouveau jeu (${m.name})`,
      icon: m.icon,
      description: m.blurb,
      tags: m.tags.join(', ')
    });
  };

  const handleSave = () => {
    if (!useGames.getState().isLoaded) {
      alert("La configuration des jeux n'est pas encore chargée, réessaie dans un instant.");
      return;
    }

    addGame({
      id: formData.id,
      name: formData.name,
      icon: formData.icon,
      description: formData.description,
      mechanic: openMech!.id,
      tags: formData.tags.split(',').map(t => t.trim()),
      enabled: true,
      data: null
    });

    alert('Jeu créé et ajouté au catalogue !');
    setOpenMech(null);
  };

  const visibleMechs = activeCat === 'tous' ? MECHS : MECHS.filter(m => m.cat === activeCat);
  const subtitle = activeCat === 'tous' 
    ? `${MECHS.length} mécaniques disponibles` 
    : `${visibleMechs.length} mécaniques — ${CATS.find(c => c.id === activeCat)?.label}`;

  const isTabOverview = detailTab === 'overview';
  const isTabSchema = detailTab === 'schema';
  const isTabExample = detailTab === 'example';

  return (
    <div className="min-h-full" style={{ backgroundColor: theme.colors.bg, fontFamily: '"Space Grotesk", sans-serif' }}>
      
      {/* ── HUD sticky ── */}
      <div 
        className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 border-b"
        style={{ backgroundColor: theme.colors.header, borderColor: `color-mix(in srgb, ${theme.colors.ink} 7%, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})` }}>🎓</div>
          <div>
            <div className="font-[Sora] font-extrabold text-[14px] leading-tight" style={{ color: theme.colors.ink }}>Moteur Pédagogique</div>
            <div className="text-[10px] font-semibold" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 40%, transparent)` }}>{MECHS.length} mécaniques · Plug & Play</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="rounded-full px-3 py-1 text-[10px] font-bold" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.primary} 20%, transparent)`, border: `1px solid color-mix(in srgb, ${theme.colors.primary} 40%, transparent)`, color: theme.colors.primary }}>
            GÉNÉRIQUE
          </div>
        </div>
      </div>

      {/* ── Intro card ── */}
      <div className="pt-4 px-4">
        <div className="rounded-2xl p-4 flex gap-3 items-start border" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${theme.colors.primary} 12%, transparent), color-mix(in srgb, ${theme.colors.accent} 8%, transparent))`, borderColor: `color-mix(in srgb, ${theme.colors.primary} 20%, transparent)` }}>
          <span className="text-xl shrink-0">💡</span>
          <div>
            <div className="font-[Sora] font-bold text-[13px] mb-1" style={{ color: theme.colors.primary }}>Comment ça marche</div>
            <p className="text-[12px] leading-relaxed m-0" style={{ color: theme.colors.muted }}>
              Chaque mécanique est un <strong style={{ color: theme.colors.ink }}>template indépendant du contenu</strong>.
              Tu fournis un fichier JSON selon le schéma, et le moteur génère le jeu. Clique sur une carte pour configurer le jeu et l'ajouter.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtres par catégorie ── */}
      <div className="pt-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {CATS.map(cat => {
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="rounded-full px-3.5 py-2 font-[Sora] font-bold text-[11px] whitespace-nowrap shrink-0 transition-all"
              style={{
                backgroundColor: isActive ? theme.colors.ink : `color-mix(in srgb, ${theme.colors.ink} 7%, transparent)`,
                color: isActive ? theme.colors.bg : `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)`,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── Compteur de résultats ── */}
      <div className="pt-3 pb-1 px-5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 30%, transparent)` }}>
        {subtitle}
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div className="px-3 pb-32 grid grid-cols-2 gap-3">
        {visibleMechs.map(m => (
          <div 
            key={m.id}
            onClick={() => handleSelect(m)}
            className="rounded-2xl overflow-hidden cursor-pointer relative"
            style={{ backgroundColor: theme.colors.surface, border: `1px solid color-mix(in srgb, ${theme.colors.ink} 8%, transparent)` }}
          >
            {/* Accent bar colorée en haut */}
            <div className="h-1" style={{ backgroundColor: m.accent }}></div>

            <div className="p-3 pb-2.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: m.iconBg }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-[Sora] font-extrabold text-[12px] leading-snug truncate" style={{ color: theme.colors.ink }}>{m.name}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: m.accent }}>{m.catLabel}</div>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed mb-2.5 line-clamp-2" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 50%, transparent)` }}>
                {m.blurb}
              </p>

              <div className="flex flex-wrap gap-1 mb-2.5">
                {m.tags.map(tag => (
                  <span key={tag} className="rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 6%, transparent)`, color: `color-mix(in srgb, ${theme.colors.ink} 45%, transparent)` }}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {m.dots.map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  ))}
                </div>
                <span className="text-[9px] font-semibold" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 30%, transparent)` }}>{m.complexity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom sheet : Fiche détail ── */}
      {openMech && (
        <>
          <div 
            onClick={() => setOpenMech(null)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          ></div>
          
          <div 
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl border-t flex flex-col"
            style={{ backgroundColor: theme.colors.header, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, maxHeight: '92svh' }}
          >
            {/* Grip + Header */}
            <div className="pt-3 px-5 shrink-0">
              <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 15%, transparent)` }}></div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: openMech.iconBg }}>{openMech.icon}</div>
                <div>
                  <div className="font-[Sora] font-extrabold text-lg" style={{ color: theme.colors.ink }}>
                    {openMech.name}
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider mt-0.5" style={{ color: openMech.accent }}>
                    {openMech.catLabel} · {openMech.complexity}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-5 shrink-0 mt-3" style={{ borderColor: `color-mix(in srgb, ${theme.colors.ink} 7%, transparent)` }}>
              {[
                { id: 'overview', label: 'Créer le Jeu' },
                { id: 'schema', label: 'Schéma JSON' },
                { id: 'example', label: 'Exemple concret' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id)}
                  className="bg-transparent pb-2.5 pt-2.5 pr-3.5 font-[Sora] font-bold text-[11px] transition-colors mr-1"
                  style={{
                    color: t.id === detailTab ? theme.colors.ink : `color-mix(in srgb, ${theme.colors.ink} 40%, transparent)`,
                    borderBottom: t.id === detailTab ? `2px solid ${openMech.accent}` : '2px solid transparent'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Corps scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">

              {/* TAB : Créer le Jeu */}
              {isTabOverview && (
                <div>
                  <p className="text-[13px] leading-relaxed mb-5" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 70%, transparent)` }}>
                    {openMech.longDesc}
                  </p>

                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>
                    Configuration du Jeu
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)` }}>ID Unique</label>
                      <input 
                        value={formData.id} 
                        onChange={e => setFormData({...formData, id: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                        style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-3">
                        <label className="block text-xs font-bold mb-1" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)` }}>Nom public</label>
                        <input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full p-2 border rounded text-sm"
                          style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)` }}>Icône</label>
                        <input 
                          value={formData.icon} 
                          onChange={e => setFormData({...formData, icon: e.target.value})}
                          className="w-full p-2 border rounded text-center text-sm"
                          style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)` }}>Tags Content Hub (séparés par virgules)</label>
                      <input 
                        value={formData.tags} 
                        onChange={e => setFormData({...formData, tags: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                        style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 5%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 10%, transparent)`, color: theme.colors.ink }}
                      />
                      <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 40%, transparent)` }}>
                        💡 <strong>Important :</strong> Ce jeu puisera automatiquement ses données dans le Content Hub centralisé (Mots, Quiz, Dictées...) en fonction des tags que vous indiquez ici. Les données ne sont plus écrites en dur.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-[Sora] font-bold text-sm transition-opacity hover:opacity-90 mt-2"
                    style={{ backgroundColor: openMech.accent, color: '#fff' }}
                  >
                    <Save size={18} /> Ajouter ce jeu au catalogue
                  </button>
                </div>
              )}

              {/* TAB : Schéma JSON */}
              {isTabSchema && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>
                    Schéma de données attendu par le composant
                  </div>
                  <div className="rounded-xl p-3.5 mb-3 overflow-x-auto border" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 4%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 8%, transparent)` }}>
                    <pre className="m-0 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.colors.primary }}>
                      {openMech.schema}
                    </pre>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>
                    Légende des champs
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {openMech.fields.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 3%, transparent)` }}>
                        <span className="text-[10px] font-extrabold rounded px-1.5 py-0.5 shrink-0" style={{ backgroundColor: f.badgeBg, color: f.badgeFg }}>
                          {f.required}
                        </span>
                        <span className="font-mono text-[11px]" style={{ color: theme.colors.accent }}>{f.key}</span>
                        <span className="text-[10px]" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>{f.type}</span>
                        <span className="text-[10px] flex-1 text-right" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 45%, transparent)` }}>{f.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB : Exemple concret */}
              {isTabExample && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>
                    {openMech.exampleDomain} — Fichier de données
                  </div>
                  <div className="rounded-xl p-3.5 mb-3 overflow-x-auto border" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 4%, transparent)`, borderColor: `color-mix(in srgb, ${theme.colors.ink} 8%, transparent)` }}>
                    <pre className="m-0 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: theme.colors.gold }}>
                      {openMech.example}
                    </pre>
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 35%, transparent)` }}>
                    Notes d'implémentation
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {openMech.notes.map((note, i) => (
                      <div key={i} className="flex gap-2.5 items-start rounded-lg p-2.5" style={{ backgroundColor: `color-mix(in srgb, ${theme.colors.ink} 4%, transparent)` }}>
                        <span className="text-[12px] shrink-0">{note.icon}</span>
                        <span className="text-[12px] leading-relaxed" style={{ color: `color-mix(in srgb, ${theme.colors.ink} 60%, transparent)` }}>{note.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </>
      )}

    </div>
  );
}

