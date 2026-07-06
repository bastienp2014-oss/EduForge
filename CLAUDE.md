# CLAUDE.md — EduForge / Mots & Blocs Québec

<!--
Ce fichier est le CLAUDE.md PROJET (racine du repo EduForge).
Il ne remplace pas votre CLAUDE.md global (~/.claude/CLAUDE.md) qui décrit
votre manière de travailler en général (style de communication, pédagogie,
niveau non-développeur). Ce fichier-ci ne contient QUE ce qui est propre à
EduForge — pas de doublon avec le global.
-->

## 1. Résumé du projet

**Nom :** EduForge (nom produit historique : Mots & Blocs Québec)

**Type :** application web multi-tenant B2B2C (SaaS white-label), à l'origine un outil d'apprentissage du français québécois pour personnes immigrantes, généralisé vers un LMS gamifié pour tout domaine de compétence.

**Objectif principal :** permettre à des créateurs (formateurs, entreprises) de déployer leur propre académie en ligne — cours, mécaniques de jeu, révision espacée (SRS) — avec génération de contenu assistée par IA validée par un humain avant publication.

**Résultat attendu à terme :** un "Deep Generation OS" — un système où l'IA propose (identité de marque, syllabus, leçons, activités) et où l'humain approuve avant que rien n'entre en production. Voir `plan.md` pour la feuille de route complète et son séquençage par phases.

## 2. Documents qui font autorité — À LIRE AVANT TOUTE ACTION

Ce projet a un historique de sessions IA multiples (Gemini, puis Claude Code). Trois documents à la racine du repo priment sur toute impression que vous pourriez avoir de l'état du code :

- **`plan.md`** (v4 au moment de la rédaction) — la roadmap active. Chaque item a un critère d'acceptation (AC) testable. C'est ce document qui pilote le travail, phase par phase. **Ne cochez jamais une case sans avoir produit la preuve de l'AC.**
- **`AUDIT_DEEP_GENERATION_OS.md`** — l'audit technique de référence (architecture, gap analysis, scores). Analyse déjà validée — ne la refaites pas, ne la contestez pas sauf incohérence factuelle avérée contre le code réel.
- **Contraintes sémantiques (section 3 ci-dessous)** — non négociables, transversales à toutes les phases.

**Règle de préséance :** sur l'état ACTUEL du code, votre lecture directe des fichiers prime toujours sur ce que dit `plan.md` ou l'audit — ces documents peuvent être en retard de quelques itérations. Sur les DÉCISIONS D'ARCHITECTURE et les PRIORITÉS, `plan.md` et l'audit font autorité — vous ne improvisez pas d'alternative sans l'exposer d'abord et attendre confirmation.

## 3. Contraintes sémantiques non négociables [SEM]

Ces règles s'appliquent à tout code touchant l'affichage de données à l'apprenant, au créateur, ou à un client B2B — pas seulement à une phase précise.

- **Jamais présenter un proxy comme une mesure de compétence.** Le système mesure de la rétention mémorielle (FSRS : stability, difficulty, lapses) et de la complétion (booléens). Aucune interface, aucun libellé, ne doit utiliser "compétence", "maîtrise", ou un pourcentage présenté comme score global de savoir pour désigner ces données. Vocabulaire correct : rétention, mémorisation, fragile/solide, complété.
- **Le tuteur IA affiche toujours sa frontière.** Ce qu'il peut faire ("t'aider sur cet item") et ce qu'il ne peut pas faire ("te suivre entre sessions", "évaluer ta compétence globale") doivent être visibles dans l'interface, pas seulement dans un message d'accueil qui disparaît.
- **Test d'autonomie sur toute mécanique de gamification** (piasses, XP, streaks, classements) : est-ce que ça développe l'apprentissage ou la dépendance au système ? Si le test échoue, reconsidérer avant d'implémenter.
- Avant de toucher un fichier qui affiche de la progression, de la rétention, ou qui utilise le mot "compétence" — invoquer la skill `eduforge-sem-check`.

## 4. Stack technique

- **Frontend** : React 19, Vite 6, TypeScript 5.8, Tailwind 4, React Router 7, Zustand 5 (state en slices : economy, inventory, settings, stats, courses, sync).
- **Backend** : Express monolithique (`server.ts`), Firebase Admin (Auth custom claims, Firestore), Sentry, rate limiting, App Check.
- **IA** : Gemini via endpoints `/api/gemini/*`, RAG maison (embeddings `text-embedding-004`).
- **Marketing** : site vitrine Astro SSR multi-tenant, séparé de l'app React.
- **Tests** : Vitest (peu de suites actuellement — voir Phase 0 du plan pour la CI à mettre en place).
- **Package manager** : npm workspaces (monorepo).

### Commandes vérifiées (2026-07-06)

```bash
npm run dev              # Lance le serveur de développement
npm run build           # Compilation Vite + bundle server.ts
npm run start           # Lance la version produite
npm run lint            # tsc --noEmit (typecheck, pas eslint séparé)
npm test                # vitest run (exécution unique)
npm run test:watch      # vitest (mode watch)
npm run test:coverage   # vitest run --coverage
npm run dev:marketing   # Démarre le site Astro marketing-site/ en dev
npm run clean           # Supprime dist/ et server.js
```

**Point important** : le script `lint` exécute `tsc --noEmit`, pas un linter syntaxique. Les vrais erreurs TypeScript doivent être corrigées par le code lui-même, pas par un auto-formatter.

## 5. Structure du repo (repères)

- `src/store/` — stores Zustand (attention : `useAppConfig.ts` et `useGames.ts` sont en cours de migration du localStorage vers Firestore, voir Phase 1 du plan).
- `src/mechanics/` — les 25 mécaniques de jeu typées + `COMPATIBILITY_MATRIX`.
- `src/services/srs.ts` — moteur SRS (FSRS v5).
- `src/features/admin/` — panneau admin (`AdminScreen.tsx`, `AdminIA.tsx`, `DataGeneratorModal.tsx`).
- `server.ts` — backend Express.
- `firestore.rules` — règles de sécurité Firestore, deny-by-default.
- `marketing-site/` — site Astro séparé.

Fichiers à ne pas modifier sans prévenir explicitement : `firestore.rules` (impact sécurité immédiat sur tous les tenants), tout fichier sous `tenants/{id}/secrets`.

## 6. Protocole de travail obligatoire

Ce protocole existe parce qu'une session précédente (sur un autre outil) a montré des dérives concrètes — il n'est pas théorique.

1. **Un item de `plan.md` à la fois.** Ne pas enchaîner plusieurs items sans validation explicite entre chacun, même si la suite semble évidente.
2. **Vérifier avant de conclure.** "Cet email est encore hardcodé" doit venir d'un `grep` réel, pas d'un souvenir de conversation. Ne jamais affirmer qu'un point de l'audit est déjà résolu sans le prouver par le code actuel.
3. **Aucune case cochée sans preuve.** Une case de `plan.md` ne passe à `[x]` que si le critère d'acceptation de l'item a été testé et que la preuve (commande + sortie, ou test qui passe) est visible.
4. **Build cassé = arrêt complet.** Si `tsc`, le lint, ou les tests échouent après une modification, ne pas continuer vers d'autres changements — corriger ou signaler, puis attendre confirmation avant de poursuivre.
5. **Ne jamais dévier de l'architecture documentée sans le signaler d'abord.** Si une référence d'implémentation existe (dans `plan.md`, l'audit, ou un fichier de référence fourni), la suivre — ne pas improviser une architecture différente (ex. : un composant non prévu) sans exposer pourquoi et attendre confirmation.
6. **Ne pas modifier l'outillage du projet sans qu'on vous le demande** — pas de suppression de fichiers de configuration, pas de changement de format d'export, même si ça semble une amélioration.
7. **Avant toute modification de `firestore.rules`** : vérifier explicitement l'impact sur tout ce qui lit les mêmes chemins sans authentification (notamment le SSR Astro) avant d'appliquer, pas après.
8. **Si vous avez vous-même écrit le code dans une session antérieure de ce même projet**, soyez vigilant au biais de défendre un choix passé ou de minimiser un constat de l'audit sans vérification fraîche. Une assistance passée n'est pas une autorisation à ne pas re-vérifier.

## 7. Sécurité

- Ne jamais écrire de clé API, secret, ou token en dur dans le code — utiliser les variables d'environnement documentées dans `.env.example`.
- Le superadmin est identifié **uniquement** par custom claim Firebase (`role === 'superadmin'`) — jamais par email en dur. Si vous voyez une comparaison d'email hardcodé réapparaître, c'est une régression à signaler avant de continuer autre chose.
- Toute lecture Firestore actuellement publique (`if true`) doit être questionnée avant d'être élargie davantage — voir Phase 0 du plan pour la liste des chemins à durcir.

## 8. Définition de "terminé" pour un item de plan.md

Un item n'est terminé que si :
- le critère d'acceptation de `plan.md` est vérifié avec une preuve concrète (commande exécutée, test qui passe) ;
- le build est propre (`tsc`, lint, tests) ;
- toute règle sémantique [SEM] concernée a été vérifiée si l'item touche de l'affichage de données ;
- toute affirmation chiffrée ou comparative sur la performance d'un modèle/outil utilisée pour justifier une décision a été vérifiée indépendamment (voir section Gouvernance de `plan.md`).

Si l'une de ces conditions manque, l'item reste `[ ]`, peu importe l'avancement apparent.
