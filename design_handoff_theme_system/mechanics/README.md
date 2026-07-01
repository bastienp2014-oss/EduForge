# 🎮 Mechanics — 25 mécaniques de jeux pédagogiques

Chaque fichier est un composant React **autonome et jouable**, prêt à être intégré dans l'application Mots & Blocs ou tout autre projet éducatif.

---

## Structure

```
mechanics/
  01_FlashcardSRS.jsx        ← Révision espacée (SM-2)
  02_MultipleChoice.jsx      ← Quiz à choix multiple + timer
  03_BinarySwipe.jsx         ← Swipe gauche/droite (2 catégories)
  04_MemoryMatch.jsx         ← Paires de cartes retournables
  05_Hangman.jsx             ← Devinette lettre par lettre
  06_Anagram.jsx             ← Lettres à réordonner
  07_ClozeTest.jsx           ← Texte à trous (drag & click)
  08_Sequencing.jsx          ← Remise en ordre (drag & drop)
  09_SortGroup.jsx           ← Tri en 2-5 catégories
  10_LineMatching.jsx        ← Association colonne gauche/droite
  11_Bingo.jsx               ← Bingo avec caleur auto ou manuel
  12_SituationalChoice.jsx   ← Choix selon contexte/registre
  13_CategoryBlaster.jsx     ← Catégorisation rapide + combo
  14_TileMerge.jsx           ← Fusion de tuiles (style 2048)
  15_WordSearch.jsx          ← Mots cachés dans une grille
  16_ChainReaction.jsx       ← Chaîne de mots (lettre/syllabe)
  17_CombinationBuilder.jsx  ← Machine à sous syllabique
  18_DialogueTree.jsx        ← Arbre de dialogue avec PNJ
  19_RebusPuzzle.jsx         ← Rébus emoji phonétiques
  20_AudioTranscription.jsx  ← Dictée + comparaison Levenshtein
  21_ErrorCorrection.jsx     ← Trouver et corriger les erreurs
  22_DeceptivePairs.jsx      ← Faux amis (contexte A vs B)
  23_DiagramLabeling.jsx     ← Étiqueter zones d'une image
  24_VoiceRecording.jsx      ← Enregistrement + auto-évaluation
  25_AudioAB.jsx             ← Comparaison audio A/B
  index.js                   ← Exports + MECHANICS_REGISTRY
```

---

## Interface commune

Toutes les mécaniques partagent la même interface de props :

```jsx
<MaMecanique
  data={jsonConfig}           // Données conformes au schéma (voir catalogue)
  onBack={() => navigate(-1)} // Retour à l'écran précédent
  onComplete={(score) => {    // Appelé quand le jeu est terminé
    addPoints(score);
    navigate('/results');
  }}
/>
```

---

## Intégration avec useTheme

Les composants utilisent des couleurs statiques pour la démo.
En production, remplacer les constantes `C` par le hook :

```jsx
// Remplacer en haut de chaque fichier :
const C = { bg:'#0f1117', ... };  // ← SUPPRIMER

// Par :
import { useTheme } from '../../store/useTheme';
const { theme } = useTheme();
const C = theme.colors;           // ← Thème dynamique
```

---

## Fournir des données

Chaque composant a un `SAMPLE` intégré qui sert de données par défaut.
Pour le contenu réel, passer un objet `data` conforme au schéma JSON
documenté dans **Moteur Jeux Pedagogiques.dc.html**.

### Exemple — Lancer une partie de Quiz

```jsx
import { MultipleChoice } from './mechanics';

const DATA = {
  config: { timerSeconds: 20, shuffle: true, showExplanation: true },
  questions: [
    {
      id: 'q1',
      question: 'Que signifie "achaler" ?',
      choices: [
        { id: 'a', text: 'Agacer',  correct: true  },
        { id: 'b', text: 'Acheter', correct: false },
      ],
      explanation: 'Achaler vient de l'anglais "to harass".'
    }
  ]
};

function MonEcranQuiz() {
  return (
    <MultipleChoice
      data={DATA}
      onBack={() => navigation.goBack()}
      onComplete={(score) => dispatch(addPiasses(score))}
    />
  );
}
```

---

## Catégories

| Catégorie | Mécaniques |
|-----------|------------|
| 📝 Texte & Vocab | FlashcardSRS, Hangman, Anagram, ClozeTest, WordSearch, ChainReaction, CombinationBuilder, ErrorCorrection, DeceptivePairs |
| 🎯 Tri & Classement | MultipleChoice, BinarySwipe, SortGroup, Sequencing, LineMatching |
| 👁️ Visuel & Logique | MemoryMatch, CategoryBlaster, TileMerge, RebusPuzzle, DiagramLabeling |
| 💬 Conversation & Social | Bingo, SituationalChoice, DialogueTree |
| 🎧 Audio & Parole | AudioTranscription, VoiceRecording, AudioAB |

---

## Complexité d'implémentation

- ⭐ Simple (1) — État local + logique straightforward
- ⭐⭐ Moyen (2) — Interactions tactiles, timer, drag & drop basique
- ⭐⭐⭐ Complexe (3) — Algorithmes, API navigateur (micro, canvas), arbres

---

*Généré dans le cadre du projet Audit UX/UI — Mots & Blocs*