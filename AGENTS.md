AGENTS.md

Instructions pour tout agent de codage IA opérant sur ce dépôt (Google AI Studio / Gemini, Claude Code, Google Jules, ou tout autre). Ce fichier est lu automatiquement au démarrage de session par les agents qui le supportent. Il complète — sans le remplacer — CLAUDE.md, qui reste la référence de gouvernance principale du projet.

───

1. Règle de verrouillage — infrastructure et sécurité critiques

Aucun agent ne modifie ni ne déploie les surfaces suivantes sans l'approbation explicite et préalable de Pat, obtenue avant l'exécution, pas après :

• firestore.rules — lecture seule pour tout agent sauf Claude Code (voir section 2)
• Tout script (Node.js, shell, ou autre) qui lit ou écrit dans la base Firestore de production (projet ai-studio-f07a6670-0671-4de0-9caf-b551ab6f37a7)
• Tout déploiement vers Google Cloud Run
• Toute modification de fichiers liés à l'authentification, aux secrets, ou aux custom claims Firebase
• Tout script de migration touchant des données de production existantes

Cette règle s'applique même si l'agent juge l'action triviale, sûre, ou évidemment correcte. La décision de contourner une validation humaine sur ces surfaces n'appartient à aucun agent.

Justification, à ne jamais oublier ni laisser un agent minimiser : lors d'une PR antérieure (Phase 0, PR #5), un agent de codage a introduit un contournement de sécurité dans un middleware d'autorisation partagé (requireSuperAdmin), qu'une revue automatique par un autre agent avait jugé acceptable à tort. La faille n'est devenue visible qu'après inspection humaine directe du code final, avant merge. Une confirmation verbale d'un agent qu'il « respecte les bonnes pratiques » n'est pas une preuve — seule l'observation de son comportement réel, la première fois qu'il touche une surface sensible, en est une.

───

2. Répartition des tâches par agent

Claude Code — seul agent habilité à :
• Modifier firestore.rules
• Exécuter des scripts contre la base Firestore de production
• Toute tâche impliquant l'authentification, l'autorisation, ou la gestion de secrets
• Toute migration de données de production

Ces tâches passent systématiquement par un PRD rédigé par Claude Web, une exécution par Claude Code sur une branche dédiée, une pull request, et une vérification par Claude Web du commit réel (via inspection directe du code, jamais sur la seule foi du rapport de l'agent) avant que Pat ne merge.

Google AI Studio (Gemini) — habilité pour, sans approbation préalable requise :
• Prototypage de composants React
• Édition de code non sensible (UI, configuration Vite/Astro, styles)
• Génération de fixtures de test, exclusivement contre l'émulateur Firestore local (FIRESTORE_EMULATOR_HOST=127.0.0.1:8080, jamais contre la base de production)
• Exécution de tests (npm test, npm run lint) en environnement de développement local

Google Jules (Gemini 3.1 Pro, asynchrone) — habilité pour :
• Tâches mécaniques, scopées, vérifiables automatiquement (tests, lint, refactoring borné)
• Jamais de logique d'autorisation ou multi-tenant sensible
• Chaque prompt doit réinjecter l'intégralité du contexte (aucune mémoire inter-session)

Claude Web — planification, architecture, PRD, arbitrage de tensions, vérification post-exécution. N'implémente jamais directement.

───

3. Protocole pour toute action sur une surface verrouillée

Si un agent autre que Claude Code identifie un besoin de modifier une surface listée en section 1 :

1. L'agent s'arrête et présente la modification proposée à Pat (diff complet, pas un résumé)
2. Pat transmet la demande à Claude Web pour évaluation et, si pertinent, rédaction d'un PRD
3. Claude Code exécute, si la tâche est validée
4. Aucun agent ne suppose qu'un mécanisme de pause interne à sa plateforme (ex. confirmation avant run_command) suffit à satisfaire cette règle — la validation humaine explicite reste la condition, indépendamment des garde-fous internes de la plateforme de l'agent.

───

4. Vérification, pas confiance

Aucune tâche n'est considérée terminée sur la base du rapport de l'agent qui l'a exécutée. Toute complétion affirmée doit être vérifiable par inspection directe du code réel (commit, PR, ou fichier) avant d'être acceptée — principe déjà en vigueur dans CLAUDE.md et appliqué de façon identique à tout agent listé dans ce fichier.
