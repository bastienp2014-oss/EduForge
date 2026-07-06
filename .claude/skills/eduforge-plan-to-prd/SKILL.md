---
name: eduforge-plan-to-prd
description: |
  Utiliser cette skill quand l'utilisateur veut attaquer un item précis (ou un petit groupe d'items liés) de plan.md dans EduForge, et a besoin d'un PRD scopé, prêt à donner à une session Claude Code fraîche. Se déclenche sur des phrases comme "prépare-moi le PRD pour l'item X du plan", "je veux attaquer la Phase 2 du plan", "extrais-moi un PRD pour le Blueprint Engine", "prochaine tranche à coder". Ne pas utiliser pour produire un PRD couvrant plusieurs phases à la fois — cette skill découpe toujours en une seule tranche verticale exécutable.
---

# eduforge-plan-to-prd — Découper plan.md en PRD scopé

## Mission

`plan.md` est la roadmap-maître d'EduForge — plusieurs phases, plusieurs mois. Une session Claude Code dérive si on lui donne tout le plan d'un coup. Cette skill extrait UN item (ou un petit groupe d'items directement liés) et produit un PRD scopé, immédiatement exécutable, sans perdre le lien avec le plan-maître.

## Quand l'invoquer

- L'utilisateur nomme un item ou une phase de `plan.md` et veut le coder maintenant.
- L'utilisateur dit "quelle est la prochaine tranche" sans préciser laquelle — dans ce cas, proposer le premier item non coché de la phase la plus basse dans le plan (les phases inférieures bloquent souvent les suivantes), pas un item plus avancé qui semble intéressant.

## Ce qu'il ne faut PAS faire

- Ne pas produire un PRD qui couvre une phase entière si elle contient plusieurs items indépendants — découper en plusieurs PRD si nécessaire.
- Ne pas réinventer l'architecture si `plan.md` ou l'audit référence déjà une implémentation ou un schéma précis — le reprendre tel quel dans la section Architecture du PRD.
- Ne pas inventer de nouveaux critères d'acceptation — reprendre celui déjà écrit dans `plan.md` pour cet item, le rendre plus concret si besoin, mais ne pas le remplacer par un autre.

## Séquence d'exécution

### 1. Localiser l'item dans plan.md

Lire `plan.md` (et `AUDIT_DEEP_GENERATION_OS.md` si l'item y fait référence). Identifier :
- Le texte exact de l'item et son AC.
- Les invariants entre crochets qui s'appliquent ([HIER], [BP], [ISO], [HITL], [COPILOT], [SEM]).
- Les dépendances : est-ce que d'autres items non cochés bloquent celui-ci ? Si oui, le signaler avant de continuer — proposer de traiter la dépendance en premier plutôt que de construire sur du sable.

### 2. Vérifier l'état réel du code

Avant d'écrire le PRD, vérifier dans le code actuel si l'item est réellement non traité (grep, lecture des fichiers concernés) — ne jamais supposer l'état à partir du plan seul, qui peut être en retard sur des sessions précédentes.

### 3. Construire le PRD

Utiliser ce gabarit :

```markdown
# PRD — [nom court de la tranche]

> Item source : plan.md, Phase [N], "[texte exact de l'item]"

## Mission
[1-3 phrases, verbe d'action + résultat concret attendu]

## Dans le périmètre
- [liste des changements précis attendus]

## Hors périmètre
- [ce qui est explicitement exclu de cette tranche, notamment les items voisins du plan qui pourraient sembler liés]

## Architecture
[Si une référence existe déjà (fichier de référence, schéma dans l'audit, pattern d'un store existant) : la nommer et dire "à suivre telle quelle". Sinon : donner les contraintes connues et laisser les détails d'implémentation à la session Claude Code, en signalant explicitement les points qui nécessitent une décision plutôt que de les trancher à sa place.]

## Point de vigilance
[Tout risque connu de régression, notamment sur des chemins partagés avec d'autres parties du système (ex: Astro SSR, rules Firestore, autres tenants) — à vérifier AVANT d'agir, pas après]

## Critère d'acceptation (repris de plan.md)
[Le texte exact de l'AC du plan, rendu vérifiable étape par étape si besoin]

## Definition of Done
- Build propre (tsc, lint, tests)
- AC vérifié avec preuve concrète
- Case correspondante de plan.md cochée avec référence au commit
```

### 4. Écrire le fichier

Nommer le fichier `PRD-[phase]-[nom-court].md` et le sauvegarder à la racine du projet ou dans un dossier `prds/` si celui-ci existe déjà dans le repo.

### 5. Présenter

Une phrase de présentation, pas de récapitulatif du contenu dans le chat — le fichier est le livrable. Mentionner explicitement : "Ce PRD est prêt à être donné à une session Claude Code fraîche, séparée de la session de planification actuelle."

## Règles absolues

- Toujours vérifier l'état réel du code avant d'écrire le PRD — ne jamais faire confiance uniquement à ce que dit plan.md sur l'état d'avancement.
- Une tranche = un PRD. Si l'utilisateur demande plusieurs items sans lien direct, produire plusieurs fichiers, pas un seul PRD fourre-tout.
- Ne jamais inventer un critère d'acceptation qui ne vient pas de plan.md — si l'item n'en a pas d'assez précis, le signaler et proposer une formulation testable, plutôt que d'en inventer un silencieusement.
