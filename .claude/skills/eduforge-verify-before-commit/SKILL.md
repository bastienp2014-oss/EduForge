---
name: eduforge-verify-before-commit
description: |
  Utiliser cette skill avant de marquer un item de plan.md comme terminé dans EduForge, avant tout commit qui touche firestore.rules, l'authentification, l'économie (piasses/XP), ou une migration de store Zustand. Se déclenche sur "coche la case", "c'est fait", "on peut committer", "marque cet item comme terminé", ou tout signal que l'utilisateur ou l'agent s'apprête à considérer une tâche close. Cette skill existe parce qu'une session précédente sur ce projet a coché des cases sans preuve suffisante, ce qui a causé une régression de sécurité — elle n'est pas une précaution théorique.
---

# eduforge-verify-before-commit — Vérification obligatoire avant clôture

## Mission

Empêcher qu'un item de `plan.md` soit marqué `[x]` — ou qu'un commit soit présenté comme terminé — sans preuve concrète que le critère d'acceptation est réellement satisfait. Cette skill est un gate mécanique, pas une simple relecture.

## Quand l'invoquer

- Juste avant de passer une case de `[ ]` à `[x]` dans `plan.md`.
- Juste avant de dire "c'est fait" ou "vous pouvez committer" à l'utilisateur.
- Après toute modification de `firestore.rules`, de la logique d'authentification, de l'économie de jeu, ou d'une migration de store — même si l'item n'est pas encore marqué terminé, ces zones méritent la vérification avant de continuer sur autre chose.

## Séquence d'exécution

### 1. Build propre — non négociable

Exécuter (en vérifiant les noms exacts de scripts dans `package.json`, ne pas les supposer) :
- Le typecheck (`tsc --noEmit` ou équivalent du projet)
- Le lint
- La suite de tests existante

Si l'une de ces commandes échoue : **arrêt complet**. Ne pas continuer vers d'autres changements, ne pas cocher la case, ne pas dire "c'est fait" en attendant de corriger plus tard. Corriger l'erreur ou la signaler clairement à l'utilisateur en attendant confirmation avant de poursuivre.

### 2. Preuve, pas déclaration

Pour toute affirmation factuelle sur l'état du code ("l'email n'est plus hardcodé", "cette route est protégée", "le fichier X a été supprimé") : produire la commande qui le prouve (`grep`, sortie de test, extrait de fichier) — ne jamais l'affirmer de mémoire de conversation ou par supposition que le travail précédent a suffi.

### 3. Critère d'acceptation vérifié étape par étape

Reprendre l'AC exact de l'item dans `plan.md`. S'il contient plusieurs conditions (ex : "deux navigateurs voient la même config" ET "isolation entre tenants" ET "pas de reset de config existante"), vérifier chacune séparément — ne pas cocher sur la base d'une seule condition satisfaite parmi plusieurs.

### 4. Vérification des effets de bord

Si le changement touche un chemin partagé (rules Firestore lues par plusieurs surfaces, un store consommé par plusieurs écrans, une route API appelée par plusieurs clients) : vérifier explicitement que les autres consommateurs de ce chemin ne sont pas cassés — avant d'appliquer, pas après avoir déjà poussé le changement.

### 5. Contrôle sémantique si applicable

Si le changement touche l'affichage de données de progression, rétention, ou tuteur IA — invoquer `eduforge-sem-check` avant de considérer l'item terminé.

### 6. Rapport de vérification

Avant de cocher quoi que ce soit, produire ce court rapport à l'utilisateur :

```text
Vérification avant clôture — [nom de l'item]
✅ / ❌ Build propre (tsc, lint, tests)
✅ / ❌ [condition 1 de l'AC] — preuve : [commande/résultat]
✅ / ❌ [condition 2 de l'AC] — preuve : [commande/résultat]
✅ / ❌ Effets de bord vérifiés sur : [liste des surfaces partagées concernées, ou "aucune" si non applicable]
```

Ne cocher la case dans `plan.md` que si toutes les lignes sont ✅.

## Règles absolues

- Un seul ❌ dans le rapport bloque la clôture, peu importe l'avancement apparent du reste.
- Ne jamais cocher une case "en attendant de vérifier plus tard" — soit c'est vérifié maintenant, soit la case reste `[ ]`.
- Ne jamais présenter un changement comme "fonctionnel" uniquement parce qu'il compile — la compilation est une condition nécessaire, jamais suffisante.
- Si une session précédente (y compris une session Claude Code antérieure sur ce même projet) a déjà affirmé qu'un point était résolu, revérifier quand même — une affirmation passée n'est pas une preuve présente.
