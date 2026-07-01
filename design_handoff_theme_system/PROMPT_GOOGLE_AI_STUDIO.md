# Prompt Google AI Studio — Mots & Blocs : Intégration du système de thème

---

## Contexte

Tu travailles sur **Mots & Blocs**, une application React/TypeScript/Tailwind d'apprentissage du québécois. Je t'ai déjà soumis le codebase complet lors d'une session précédente.

Ce prompt décrit les **nouveaux ajouts** à intégrer dans le codebase existant. Tous les fichiers nécessaires sont joints à ce message.

---

## Ce qui a changé depuis la dernière version

### 1. Store de thème étendu — `useTheme.js`
**Remplace** `src/store/useTheme.ts` par le fichier `useTheme.js` fourni.

Nouveautés par rapport à l'original :
- `fonts: { display, body }` — polices par thème (Sora, Space Grotesk, Fredoka, Outfit)
- `scale: 0.9 | 1 | 1.12` — taille du texte (Petit / Moyen / Grand)
- `radius: 'carre' | 'doux' | 'rond'` — arrondi des coins
- `shadow: 'plat' | 'doux' | 'prononce'` — niveau d'ombrage
- `contrast: boolean` — mode contrasté (accessibilité)
- `soundPack: 'foret' | 'arcade' | 'doux'` — pack sonore (futur)
- **12 thèmes prédéfinis** (voir `PREDEFINED_THEMES` dans le fichier)
- `personalTheme` — thème personnalisé persisté en localStorage
- `patchPersonal(patch)` — modifie le thème personnel sans écraser les autres champs
- `applyThemeTokens(theme)` — applique les tokens CSS sur `:root`
- `useThemeTokens()` — hook qui retourne `{ radCard, radBtn, shadow, border, scale }`

**Action requise dans `App.tsx` :** appeler `applyThemeTokens(theme)` au montage :
```tsx
import { useTheme, applyThemeTokens } from './store/useTheme';
const { theme } = useTheme();
useEffect(() => { applyThemeTokens(theme); }, [theme]);
```

---

### 2. Shell de navigation persistant — `AppShell.jsx`
**Nouveau fichier** à placer dans `src/components/AppShell.jsx`.

**Remplace** la logique de navigation dans `App.tsx`. Il s'agit d'un shell qui :
- Affiche un **HUD global** (niveau + titre + piasses) en haut des écrans "hubs"
- Affiche une **bottom nav** (Accueil / Ville / Jeux / Profil) sur ces mêmes écrans
- **Cache** automatiquement le HUD et la nav dans les jeux et écrans secondaires (les jeux ont leur propre `GameHUD`)

Les écrans "hubs" (shell visible) sont : `home`, `ville`, `depanneur`, `profil`, `store`, `leaderboard`, `portefeuille`, `dictionnaire`, `apparence`.

**Intégration dans `App.tsx` :**
```tsx
import AppShell from './components/AppShell';

// Dans le rendu :
<AppShell currentScreen={currentScreen} onNavigate={navigateTo}>
  {currentScreen === 'home'      && <HomeScreen />}
  {currentScreen === 'ville'     && <VilleScreen />}
  {currentScreen === 'depanneur' && <DepanneurScreen />}
  {currentScreen === 'profil'    && <ProfilScreen />}
  {/* Jeux — ont leur propre GameHUD */}
  {currentScreen === 'pendu'     && <PenduScreen onBack={() => navigateTo('home')} />}
  {currentScreen === 'hache'     && <HacheScreen onBack={() => navigateTo('home')} />}
  {currentScreen === '2048'      && <Game2048Screen onBack={() => navigateTo('home')} />}
  {/* ... tous les autres écrans ... */}
</AppShell>
```

---

### 3. Cinq composants partagés pour les jeux

Ces 5 fichiers vont dans `src/components/`. **Tous les jeux doivent les utiliser** à la place de leurs éléments hardcodés actuels.

#### `GameHUD.jsx`
Remplace le header custom dans chaque jeu. Usage :
```tsx
import GameHUD from '../../components/GameHUD';
<GameHUD title="Hache" onBack={onBack} />
<GameHUD title="Pendu" onBack={onBack} extra={<span>🔥 {streak}</span>} />
```

#### `GameProgress.jsx`
Barre de progression et vies. Usage :
```tsx
import GameProgress from '../../components/GameProgress';
<GameProgress lives={lives} maxLives={3} score={score} current={step} total={10} />
```

#### `GameButton.jsx`
Bouton standard (5 variantes). Usage :
```tsx
import GameButton from '../../components/GameButton';
<GameButton variant="primary" onPress={valider} size="lg" fullWidth>Valider</GameButton>
<GameButton variant="secondary" onPress={aide}>Aide</GameButton>
<GameButton variant="danger" onPress={abandon}>Abandonner</GameButton>
```

#### `GameResult.jsx`
Modale de fin de jeu universelle. **Remplace tous les écrans de fin custom** dans chaque jeu :
```tsx
import GameResult from '../../components/GameResult';
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

#### `GameCard.jsx`
Carte / panneau thémé. Usage :
```tsx
import GameCard from '../../components/GameCard';
<GameCard highlighted accent="primary">
  <p>Contenu de la carte</p>
</GameCard>
```

---

### 4. Écran Apparence — `ApparenceScreen.jsx`
**Nouveau fichier** à placer dans `src/features/apparence/ApparenceScreen.jsx`.

C'est l'écran de personnalisation du thème, accessible depuis le profil ou les réglages. Il comprend :
- Galerie des 12 thèmes prédéfinis
- Customizer complet : couleur principale + accent (swatches, color picker natif, champ hex, pipette EyeDropper), police des titres, taille du texte, coins, ombrage, ambiance clair/sombre, mode contrasté
- Simulation daltonisme (aperçu uniquement, filtre CSS)
- Mode auto Jour/Nuit (suit `prefers-color-scheme`)
- Historique des 5 derniers thèmes
- Aperçu en direct (3 contextes : Accueil, Jeu, Commerce)

**Intégration dans `App.tsx` :**
```tsx
import ApparenceScreen from './features/apparence/ApparenceScreen';
{currentScreen === 'apparence' && <ApparenceScreen onBack={() => navigateTo('profil')} />}
```
Ajouter un lien vers `'apparence'` depuis `ProfilScreen` ou les réglages.

---

### 5. Utilitaire couleurs tuiles 2048 — `tileColors.js`
**Nouveau fichier** à placer dans `src/utils/tileColors.js`.

Remplace les couleurs hardcodées Tailwind dans `Game2048Screen.tsx` :

**Avant :**
```tsx
function getTileColor(val) {
  const hash = ...;
  const colors = ["bg-red-500", "bg-orange-500", ...]; // hardcodé
  return colors[hash % colors.length];
}
```

**Après :**
```tsx
import { getTileColors, getTileTextColor } from '../../utils/tileColors';
import { useTheme } from '../../store/useTheme';

const { theme } = useTheme();
const TILE_COLORS = getTileColors(theme.colors.primary);

function getTileStyle(val) {
  const hash = Array.from(val).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bg = TILE_COLORS[hash % TILE_COLORS.length];
  const color = getTileTextColor(bg, theme.colors.ink);
  return { background: bg, color };
}
// Remplacer className={getTileColor(val)} par style={getTileStyle(tile.value)}
```

---

### 6. Modifications spécifiques par jeu

#### `HacheScreen.tsx`
- Remplacer le header custom par `<GameHUD title="Hache" onBack={onBack} />`
- Remplacer l'écran de fin par `<GameResult state={...} .../>`
- Fond de scène : remplacer `bg-slate-900` par `style={{ background: theme.colors.bg }}`
- ⚠️ **La cible SVG (anneaux) ne change pas** — c'est l'identité visuelle du jeu

#### `PenduScreen.tsx`
- Remplacer le header custom par `<GameHUD title="Pendu" onBack={onBack} />`
- Remplacer `stroke-slate-300` par `stroke={theme.colors.ink}` (structure du bonhomme)
- Remplacer `stroke-red-500` par `stroke={theme.colors.danger}` (erreurs)
- Clavier : touche correcte → `background: theme.colors.success`, erreur → `background: theme.colors.danger`
- Remplacer l'écran de fin par `<GameResult .../>`

#### `Game2048Screen.tsx`
- Remplacer le header par `<GameHUD title="2048" onBack={onBack} />`
- Remplacer `getTileColor()` par `getTileStyle()` (voir section 5 ci-dessus)
- Remplacer l'écran de fin par `<GameResult .../>`

#### `SwipeScreen.tsx`, `SortScreen.tsx`, `QuizScreen.tsx`
- Remplacer header → `<GameHUD />`
- Remplacer cartes → `<GameCard />`
- Remplacer boutons → `<GameButton />`
- Remplacer fin → `<GameResult />`

---

## Fichiers joints

| Fichier | Destination dans le projet |
|---|---|
| `useTheme.js` | `src/store/useTheme.ts` (remplace) |
| `AppShell.jsx` | `src/components/AppShell.jsx` (nouveau) |
| `GameHUD.jsx` | `src/components/GameHUD.jsx` (nouveau) |
| `GameProgress.jsx` | `src/components/GameProgress.jsx` (nouveau) |
| `GameButton.jsx` | `src/components/GameButton.jsx` (nouveau) |
| `GameResult.jsx` | `src/components/GameResult.jsx` (nouveau) |
| `GameCard.jsx` | `src/components/GameCard.jsx` (nouveau) |
| `ApparenceScreen.jsx` | `src/features/apparence/ApparenceScreen.jsx` (nouveau) |
| `tileColors.js` | `src/utils/tileColors.js` (nouveau) |
| `Shell Global.dc.html` | Référence visuelle — shell + navigation |
| `Selecteur de Theme.dc.html` | Référence visuelle — écran Apparence |
| `Gabarit Jeu.dc.html` | Référence visuelle — anatomie d'un jeu |
| `README.md` | Documentation complète |

---

## Polices à ajouter dans `index.html`

```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;600;700&family=Fredoka:wght@400;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## Priorité d'intégration suggérée

1. `useTheme.js` + `applyThemeTokens` dans `App.tsx`
2. `AppShell.jsx` + refactoring navigation
3. `GameHUD.jsx` dans tous les jeux
4. `GameResult.jsx` dans tous les jeux
5. `GameButton.jsx` + `GameCard.jsx` dans les jeux
6. `ApparenceScreen.jsx` + lien depuis Profil
7. `tileColors.js` dans `Game2048Screen`
8. Corrections spécifiques Pendu (stroke) + Hache (bg)
