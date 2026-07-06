---
name: eduforge-sem-check
description: |
  Utiliser cette skill avant de terminer toute tâche EduForge qui touche l'affichage de données à l'apprenant, au créateur, ou à un client B2B — dashboards, écrans de progression, tuteur IA, pages marketing, tout composant qui présente de la rétention, de la complétion, ou un "graphe" de suivi. Se déclenche aussi explicitement sur "vérifie le vocabulaire", "check sémantique", "est-ce que ça respecte les contraintes SEM". Cette skill existe parce que le programme de recherche pédagogique du projet a identifié un risque concret et documenté : présenter de la rétention mémorielle comme une mesure de compétence.
---

# eduforge-sem-check — Garde-fou sémantique (rétention vs compétence)

## Mission

Vérifier qu'aucune interface, aucun libellé, aucun commentaire destiné à un humain (créateur, apprenant, client B2B) ne présente une donnée de rétention/complétion comme une mesure de compétence — et que le tuteur IA affiche toujours sa frontière de capacité.

## Contexte (pourquoi cette skill existe)

Le système d'EduForge mesure deux choses réelles : la **rétention mémorielle** (FSRS : `stability`, `difficulty`, `lapses`) et la **complétion** (booléens de leçons terminées). Aucune des deux n'est une mesure de "capacité à agir en contexte nouveau" — ce qu'on entend normalement par compétence. Un diagnostic produit dans ce projet a établi que le risque le plus sérieux à long terme est la dérive sémantique : appeler cet agrégat "Skill Graph" ou "niveau de compétence" dans l'interface ou la communication commerciale, alors qu'il ne mesure que de la mémorisation.

## Quand l'invoquer

- Avant de terminer une tâche touchant : `DashboardMemorielScreen`, tout composant tuteur (`AITutorChat.tsx` et futurs), tout futur "graphe de rétention", toute page marketing qui décrit ce que le produit mesure.
- Après génération de contenu marketing ou de copie d'interface par un copilot IA (Brand Copilot, Course Copilot).
- Sur demande explicite de contrôle sémantique.

## Séquence d'exécution

### 1. Scanner le vocabulaire interdit

Rechercher dans les fichiers concernés (composants UI, fichiers de traduction/i18n, prompts destinés aux copilots, pages marketing) :
- "compétence", "maîtrise", "skill" (hors nom de variable technique déjà existant type `MECHANIC_REGISTRY` qui n'est pas un problème)
- tout pourcentage ou score présenté comme mesure globale de savoir

### 2. Pour chaque occurrence trouvée

Distinguer deux cas :
- **Occurrence dans un nom de variable/fichier technique interne** (ex : `skill_graph_component.tsx` en tant que nom de fichier) → pas un problème en soi, mais vérifier que le libellé **affiché à l'utilisateur** ne reprend pas ce mot tel quel.
- **Occurrence dans un texte visible par un humain** (label UI, texte marketing, message du tuteur, documentation destinée au créateur) → à corriger.

### 3. Proposer la reformulation

Vocabulaire de remplacement approuvé :
- "niveau de compétence" / "score de maîtrise" → "rétention", "mémorisation", "concepts solides / fragiles"
- "Skill Graph" → "graphe de rétention mémorielle"
- "l'IA a évalué ta compétence à X%" → "voici les idées présentes / à approfondir dans ta réponse" (formulation de rétroaction, jamais un score global)

Si le mot "compétence" est jugé commercialement nécessaire par l'utilisateur pour une raison précise, ne pas le retirer silencieusement — signaler l'exigence [SEM-1] et proposer d'accompagner le terme d'une définition explicite et visible ("ce score reflète la rétention d'items liés, pas une évaluation de ta capacité à appliquer ce concept en situation réelle") plutôt que de bloquer la demande.

### 4. Vérifier la frontière du tuteur IA

Si le composant touché est un tuteur ou assistant conversationnel : vérifier qu'un texte visible en permanence dans l'interface (pas seulement un message d'accueil qui disparaît après le premier tour) indique ce que le tuteur peut et ne peut pas faire.

### 5. Rapport

```text
Contrôle sémantique — [fichier(s) vérifié(s)]
Occurrences trouvées : [nombre]
- [fichier:ligne] — "[texte trouvé]" → suggestion : "[reformulation]"
Frontière du tuteur visible en permanence : ✅ / ❌ / non applicable
```

## Règles absolues

- Ne jamais corriger silencieusement sans montrer le rapport — l'utilisateur doit voir ce qui a été trouvé et pourquoi, pas seulement recevoir un diff.
- Ne jamais accepter "compétence" dans une interface sans la définition explicite qui l'accompagne, même si la demande initiale de l'utilisateur ne mentionnait pas ce garde-fou — c'est une contrainte de projet, pas une préférence ponctuelle.
- Ne pas confondre un nom de variable technique interne avec un libellé visible par un humain — seul le second est concerné par cette skill.
