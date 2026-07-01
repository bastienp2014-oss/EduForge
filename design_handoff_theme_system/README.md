# Handoff : Système de thème unifié — Mots & Blocs

## Vue d'ensemble

Ce paquet contient tout ce qu'il faut pour intégrer un **gestionnaire de thèmes complet** dans l'application React/Tailwind existante *Mots & Blocs*, ainsi que **5 composants partagés** qui s'appliquent à tous les jeux (Hache, Pendu, 2048, Sort, Swipe, Quiz, etc.).

## À propos des fichiers de design

Les fichiers `.dc.html` dans `design_reference/` sont des **maquettes interactives HTML** créées à titre de référence visuelle. Elles montrent l'apparence et les comportements attendus. La tâche est de **recréer ces designs dans le codebase React/TypeScript/Tailwind existant** en utilisant les fichiers `.ts`/`.tsx` fournis dans ce paquet — pas de copier-coller le HTML directement.

## Fidelité

**High-fidelity.** Les maquettes montrent les couleurs exactes, typographies, espacements et interactions cibles. Les composants fournis (`useTheme.extended.ts` + `components/`) sont déjà écrits en TypeScript et correspondent pixel pour pixel aux maquettes.

---

## Fichiers fournis

```
design_handoff_theme_system/
├── useTheme.extended.ts          ← Remplace src/store/useTheme.ts
├── components/
│   ├── GameHUD.tsx               ← Header universel (tous les jeux)
│   ├── GameProgress.tsx          ← Barre de progression / vies
│   ├── GameButton.tsx            ← Bouton standard (5 variantes)
│   ├── GameResult.tsx            ← Modale fin de jeu
│   └── GameCard.tsx              ← Carte / panneau générique
└── design_reference/
    ├── Shell Global.dc.html      ← Maquette shell + navigation
    ├── Selecteur de Theme.dc.html← Maquette écran Apparence
    └── Gabarit Jeu.dc.html       ← Anatomie jeu + tokens + recommandations
```

---

## Intégration étape par étape

### Étape 1 — Remplacer useTheme.ts

```bash
cp useTheme.extended.ts src/store/useTheme.ts
rm src/store/useTheme.backup.ts  # plus nécessaire
```

### Étape 2 — Copier les composants

```bash
cp components/GameHUD.tsx      src/components/GameHUD.tsx
cp components/GameProgress.tsx src/components/GameProgress.tsx
cp components/GameButton.tsx   src/components/GameButton.tsx
cp components/GameResult.tsx   src/components/GameResult.tsx
cp components/GameCard.tsx     src/components/GameCard.tsx
```

### Étape 3 — Appliquer les tokens CSS au démarrage

Dans `src/App.tsx`, appeler `applyThemeTokens` au montage :

```tsx
import { useTheme, applyThemeTokens } from './store/useTheme';

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    applyThemeTokens(theme);
  }, [theme]);

  // ...
}
```

### Étape 4 — Ajouter les polices Google Fonts

Dans `index.html` (ou `App.tsx`) :

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;600;700&family=Fredoka:wght@400;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
```

### Étape 5 — Remplacer les headers dans les jeux

**Avant (exemple HacheScreen.tsx) :**
```tsx
<div className="flex justify-between items-center p-4 bg-slate-900">
  <button onClick={onBack}><ArrowLeft /></button>
  <span>Hache</span>
  <div>{piasses} ⚜️</div>
</div>
```

**Après :**
```tsx
import GameHUD from '../../components/GameHUD';
// ...
<GameHUD title="Hache" onBack={onBack} />
```

### Étape 6 — Remplacer les écrans de fin de jeu

**Avant :**
Chaque jeu a son propre écran de fin (ex: `gameFinished && <div className="...">Bravo !</div>`).

**Après :**
```tsx
import GameResult from '../../components/GameResult';
// ...
{gameFinished && (
  <GameResult
    state={lives > 0 ? 'win' : 'lose'}
    points={score}
    streak={streak}
    onReplay={restart}
    onBack={onBack}
    nextLabel="Prochain défi"
    onNext={nextChallenge}
  />
)}
```

### Étape 7 — Remplacer les boutons hardcodés

**Avant :**
```tsx
<button className="bg-blue-600 text-white rounded-xl px-4 py-3 font-bold">
  Valider
</button>
```

**Après :**
```tsx
import GameButton from '../../components/GameButton';
// ...
<GameButton variant="primary" onPress={valider}>Valider</GameButton>
<GameButton variant="secondary" onPress={aide}>Aide</GameButton>
```

### Étape 8 — Ajouter l'écran Apparence

Créer `src/features/apparence/ApparenceScreen.tsx` en s'inspirant de la maquette `design_reference/Selecteur de Theme.dc.html`.

L'écran doit :
- Afficher la galerie des 12 thèmes prédéfinis (`PREDEFINED_THEMES` depuis `useTheme.ts`)
- Appeler `setThemeById(id)` au tap sur une carte
- Afficher le customizer (couleur picker, axes de perso) qui appelle `patchPersonal(patch)`
- Être accessible depuis les réglages ou le profil

---

## Composants : référence rapide

### GameHUD
| Prop | Type | Requis | Description |
|---|---|---|---|
| `title` | `string` | ✅ | Titre du jeu affiché au centre |
| `onBack` | `() => void` | ✅ | Retour à l'écran précédent |
| `extra` | `ReactNode` | — | Élément optionnel (streak, timer…) |

### GameProgress
| Prop | Type | Default | Description |
|---|---|---|---|
| `lives` | `number` | — | Vies restantes (cœurs) |
| `maxLives` | `number` | `3` | Total des vies |
| `score` | `number` | — | Score affiché à droite |
| `current` | `number` | — | Progression actuelle |
| `total` | `number` | — | Total pour la barre |
| `showBar` | `boolean` | `true` | Afficher la barre |

### GameButton
| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `primary\|secondary\|ghost\|danger\|success` | `primary` | Style visuel |
| `size` | `sm\|md\|lg` | `md` | Taille |
| `fullWidth` | `boolean` | `false` | Pleine largeur |
| `disabled` | `boolean` | `false` | État désactivé |
| `onPress` | `() => void` | — | Handler |

### GameResult
| Prop | Type | Requis | Description |
|---|---|---|---|
| `state` | `'win'\|'lose'` | ✅ | Résultat |
| `title` | `string` | — | Titre (défaut auto) |
| `subtitle` | `string` | — | Sous-titre (défaut auto) |
| `points` | `number` | — | Piasses gagnées |
| `streak` | `number` | — | Série actuelle |
| `onReplay` | `() => void` | ✅ | Rejouer |
| `onBack` | `() => void` | ✅ | Retour |
| `nextLabel` | `string` | — | Label bouton suivant |
| `onNext` | `() => void` | — | Action suivant |

### GameCard
| Prop | Type | Default | Description |
|---|---|---|---|
| `highlighted` | `boolean` | `false` | Contour coloré |
| `accent` | `primary\|accent\|success\|danger` | `primary` | Couleur du contour |
| `padding` | `number\|string` | `16` | Padding interne |
| `onClick` | `() => void` | — | Rend la carte cliquable |

---

## Tokens CSS disponibles (après applyThemeTokens)

Ces variables CSS sont disponibles globalement après l'appel à `applyThemeTokens()` :

```css
var(--color-primary)   /* Bouton principal */
var(--color-accent)    /* 2ème accent */
var(--color-header)    /* Fond HUD */
var(--color-bg)        /* Fond écrans */
var(--color-surface)   /* Cartes, panneaux */
var(--color-ink)       /* Texte principal */
var(--color-muted)     /* Texte secondaire */
var(--color-gold)      /* Piasses */
var(--color-success)   /* Bonne réponse */
var(--color-danger)    /* Mauvaise réponse */
var(--color-border)    /* Bordures (contraste auto) */
var(--font-display)    /* Police titres */
var(--font-body)       /* Police corps */
var(--radius-card)     /* Rayon des cartes */
var(--radius-btn)      /* Rayon des boutons */
var(--shadow-card)     /* Ombre des cartes */
var(--theme-scale)     /* Échelle de texte (0.9–1.12) */
```

---

## Recommandations spécifiques par jeu

### HacheScreen
- ✅ `GameHUD` + `GameButton` pour les options de réponse
- ✅ Fond de scène : utiliser `theme.colors.bg` (sombre recommandé)
- 🔒 **Cible SVG (anneaux) : ne pas thématiser** — identité visuelle fixe du jeu

### PenduScreen
- ✅ `GameHUD` + `GameProgress` (vies = erreurs)
- ✅ SVG bonhomme : `stroke={theme.colors.ink}` (structure) + `stroke={theme.colors.danger}` (parties du corps au fur des erreurs)
- ✅ Clavier : touche correcte → `colors.success`, erreur → `colors.danger`

### Game2048Screen
- ✅ `GameHUD` + `GameProgress` (score)
- ✅ Couleurs des tuiles : dériver de `colors.primary` via HSL (voir `Gabarit Jeu.dc.html` section ②)
- Formule : `hslToHex(h, s * lightnessFactor, l + offset)` pour 8 niveaux

### SwipeScreen / SortScreen / QuizScreen
- ✅ `GameHUD` + `GameCard` pour les cartes à swiper/trier
- ✅ `GameResult` pour la fin

---

## Thèmes prédéfinis (12)

| ID | Nom | Sombre |
|---|---|---|
| `automne` | Automne Boréal | Non |
| `minuit` | Minuit Laurentien | Oui |
| `erable` | Forêt d'Érable | Non |
| `neige` | Première Neige | Non |
| `arcade` | Néon Arcade | Oui |
| `cabane` | Cabane à Sucre | Non |
| `saint_jean` | Fête Saint-Jean | Oui |
| `toundra` | Toundra Boréale | Oui |
| `poutine` | Fromage en Crottes | Non |
| `fleuve` | Fleuve Saint-Laurent | Non |
| `violette` | Violette des Prés | Non |
| `nuit_polaire` | Nuit Polaire | Oui |

---

## Assets

- Polices : Google Fonts (Sora, Space Grotesk, Fredoka, Outfit) — CDN public
- Icônes : Lucide React (déjà dans le projet)
- Animations : motion/react (déjà dans le projet)
- Aucune image requise pour les composants partagés

---

## Notes importantes

1. **Ne pas utiliser `bg-*` Tailwind hardcodé dans les jeux** — toujours passer par `theme.colors.*`
2. **`useThemeTokens()`** retourne les valeurs calculées (radius, shadow, border) selon les préférences utilisateur
3. La persistence est gérée automatiquement par Zustand (`localStorage` clé `mots-blocs-theme-v2`)
4. L'ancienne clé de persistence (`mots-blocs-theme` ou similaire) sera ignorée — les utilisateurs existants repartiront sur le thème par défaut `automne`
