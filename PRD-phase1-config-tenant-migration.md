# PRD — Migration config tenant vers Firestore (Phase 1, EduForge)

> **Pourquoi ce PRD est scopé à un seul item et pas à tout le projet :** `plan.md` couvre 6 phases sur plusieurs mois — c'est votre roadmap-maître, pas un PRD à donner tel quel à une session Claude Code. Un PRD efficace reste une "tranche verticale" qu'une session peut exécuter de bout en bout sans dériver. Celui-ci correspond à un seul item de la Phase 1 : la migration de `useGames`/`useAppConfig` du localStorage vers Firestore — le plus prêt à exécuter, puisqu'une implémentation de référence complète existe déjà. La skill `eduforge-plan-to-prd` (fournie séparément) reproduit cette méthode pour n'importe quel futur item du plan.

---

## Mission

Migrer la configuration de chaque tenant (jeux actifs, nom de l'app, devise, tags, feature flags) du `localStorage` du navigateur vers Firestore, pour que tous les administrateurs d'un même tenant voient la même configuration, peu importe l'appareil ou le navigateur utilisé.

## Dans le périmètre

- Réécriture de `src/store/useAppConfig.ts` et `src/store/useGames.ts` en pattern `load(tenantId)` déclenché par la résolution du tenant (pas d'auto-hydratation à l'import).
- Câblage du chargement dans `src/App.tsx` (ou équivalent), déclenché quand `currentTenant.id` devient disponible.
- Durcissement d'une ligne dans `firestore.rules` : `configuration/{document=**}` passe de `read: if true` à `read: if isSignedIn()`.
- Migration transparente des données `localStorage` existantes (`quebec-app-config`, `quebec-games`) vers Firestore au premier chargement, sans réinitialiser la config d'un tenant déjà en production.
- Garde-fous d'affichage : les écrans admin qui lisent la config tolèrent un état `isLoaded === false` (spinner), pas d'affichage des valeurs par défaut pendant le chargement réseau.

## Hors périmètre (explicitement, pour cette tranche)

- Aucune autre store Zustand n'est touchée dans cette tranche.
- Aucune nouvelle règle Firestore d'écriture — la règle d'écriture `configuration` existe déjà et est correcte (`isAdmin() || isTenantAdmin(tenantId)`), elle ne doit pas être dupliquée ni modifiée.
- Pas de changement du SSR Astro dans cette tranche — mais **vérification obligatoire avant d'appliquer le durcissement de lecture** (voir Point de vigilance ci-dessous).

## Architecture — implémentation de référence

Une implémentation complète existe déjà et doit être suivie plutôt que réinventée : **`PHASE1_config_migration_reference.md`** (produite précédemment dans ce projet). Elle contient :
- Le code complet des deux stores réécrits.
- Le diff exact de `firestore.rules`.
- Le câblage `App.tsx`.
- La logique de migration transparente du localStorage existant.
- Un test d'acceptation manuel en 5 étapes.

**Action attendue de Claude Code :** lire ce fichier de référence en premier, vérifier qu'il correspond toujours à l'état actuel du code (les fichiers ont pu changer depuis sa rédaction), signaler tout écart avant d'appliquer, puis implémenter en suivant cette référence — pas une architecture alternative improvisée.

## Point de vigilance — bloquant avant d'agir

Avant d'appliquer le durcissement de `firestore.rules` sur la lecture de `configuration`, vérifier si le SSR Astro (`marketing-site/`) lit ce chemin sans authentification. Si oui, ce durcissement casserait le site vitrine. Poser la question de façon fermée si le doute persiste après inspection du code : *"Le SSR Astro lit-il `tenants/{id}/configuration` sans authentification ?"* — ne pas appliquer le changement de rules avant d'avoir la réponse.

## Critère d'acceptation (repris de `plan.md`)

**"Deux navigateurs voient la même config."** Concrètement :
1. Navigateur A (admin tenant X) modifie l'`appName`. Après ~1 seconde, la valeur est visible dans Firestore (`tenants/X/configuration/appConfig`).
2. Navigateur B (autre session, même tenant X) recharge — la nouvelle valeur apparaît.
3. Tenant Y (autre tenant) n'est pas affecté — isolation vérifiée.
4. Un compte avec une config `localStorage` préexistante conserve sa configuration personnalisée au premier chargement post-déploiement — pas de reset aux valeurs par défaut.

Aucune case de `plan.md` ne doit être cochée avant que ces 4 points soient vérifiés avec preuve (capture, log Firestore, ou test automatisé).

## Definition of Done

- Build propre : `tsc`, lint, tests existants passent.
- Les 4 points du critère d'acceptation ci-dessus sont vérifiés et documentés dans le commit ou la pull request.
- La case correspondante dans `plan.md` (Phase 1, "Config tenant en BDD") passe à `[x]` avec référence au commit.
- Aucune régression sur le SSR Astro (vérifié avant, pas après, le durcissement des rules).
