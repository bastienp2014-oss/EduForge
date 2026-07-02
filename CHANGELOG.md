# Changelog

Toutes les modifications notables apportées à la plateforme **EduForge** (le moteur SaaS B2B) seront documentées dans ce fichier. Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## Prochaine Étape Prioritaire

La prochaine étape logique est **la Génération Pédagogique Granulaire (Leçons)** dans l'éditeur de Parcours (`AdminParcours.tsx`).
*Pourquoi ?* Nous avons implémenté la génération globale de l'architecture de l'application via RAG ("Le Gros JSON") et validé la route backend de génération de leçon RAG (`/api/gemini/generate-lesson-rag`). La prochaine étape est de permettre aux créateurs de générer le texte détaillé d'une leçon spécifique directement depuis l'éditeur de Syllabus, en utilisant le contexte de la leçon et de l'application via le pipeline RAG.

## [Unreleased] - En cours de développement

### Ajouté
- **Sécurisation des Endpoints Backend avec Firebase App Check** : Implémentation du middleware `requireAppCheck` sur l'ensemble des endpoints `/api/gemini/*` et `/api/admin/*` dans `server.ts`. Migration de tous les appels client (`fetch`) vers le wrapper `secureFetch` (défini dans `src/utils/secureFetch.ts`), assurant l'injection automatique du token Firebase App Check et du token d'authentification. Ajout d'un mode "monitor" via `APP_CHECK_ENFORCE` (actuellement `false` en `.env.example`) pour permettre une transition sécurisée sans rupture de service immédiate.
- **Règles Firestore Verrouillées** : Mise à jour de `firestore.rules` pour bloquer toute création ou modification de document utilisateur contenant des champs d'économie (`xp` ou `piasses`) non nuls via le client.
- **Migration Complète de la Gamification** : Alignement de tous les écrans, modules de jeux et actions utilisateur (`HacheScreen`, `SortScreen`, `SwipeScreen`, `TuInterrogatifScreen`, `QuizScreen`, `Game2048Screen`, `ContractionsScreen`, `TutoiementScreen`, `LessonGameScreen`, `DynamicGameScreen`, `OnboardingScreen`, `HomeScreen`, `coursesSlice`, `inventorySlice`, `useSrs`) sur l'utilisation exclusive de `claimReward` avec les identifiants d'activités serveur correspondants.
- **Intégration Design Handoff (Batch 1 à 6)** : Fusion pixel-perfect de l'esthétique du Handoff (`design_handoff_theme_system/mechanics`) avec la logique métier et le typage strict dans `src/mechanics`. Remplacement des couleurs codées en dur par le système dynamique `useThemeTokens`.
  - Intégration achevée pour **TOUTES LES MÉCANIQUES (1 à 25)** : `01_FlashcardSRS` à `25_AudioAB`.
  - Fix des props du composant universel `GameResult` (state, points, title) au lieu des props obsolètes (score, xp).
- **Refactoring "Gold Standard" des Mécaniques de Jeu** : Élimination complète de `any` et typage strict des mécaniques de jeu `02_MultipleChoice.tsx`, `03_BinarySwipe.tsx`, `04_MemoryMatch.tsx` et `05_Hangman.tsx` avec validation de compilation linter sans erreur (`npm run lint`).
  - *Multiple Choice* : Raccordé au type structuré `MultipleChoiceData` pour supporter la configuration de minuteurs customisés.
  - *Binary Swipe* : Création de `BinarySwipeItem` et structuration des swipes, raccordé à la configuration `BinarySwipeData` (labels, emojis, couleurs personnalisables).
  - *Memory Match* : Création de l'interface `MemoryCard`, typage strict du cycle d'état, sécurisation du moteur de comparaison contre les valeurs undefined au runtime, et ajout de flexibilité dans `MemoryMatchData` pour les propriétés de configuration.
  - *Hangman* : Création de l'interface locale `HangmanWord` et raccordement aux configurations typées `HangmanData`.
- **Enrichissement du Scaffolding RAG** : Ajout du marketing (slogan, description) et d'un jeu de vocabulaire de base généré par RAG (route `/api/gemini/generate-scaffold-rag`). Ce vocabulaire est automatiquement injecté dans l'Arcade (SRS) en tant que `CustomContentItems`.
- **Générateur de Leçons RAG (UI)** : Ajout d'une interface de test dans `AdminIA.tsx` pour appeler `/api/gemini/generate-lesson-rag`, validant ainsi la brique fonctionnelle de rédaction granulaire de cours via IA.
- **Mutualisation et Migration RAG (Syllabus & Leçons)** : Renommage de la route backend en `/api/gemini/generate-json-rag` (au lieu de `generate-game-rag`) pour refléter son rôle générique. Migration complète de `AdminParcours.tsx` (Générateur de Syllabus) pour utiliser cette route RAG au lieu de l'ancienne route sans contexte.
- **Nettoyage de la dette technique** : Suppression de la fonctionnalité dupliquée obsolète "Super Ready-to-Learn App Creator" dans `AdminParcours.tsx`.
- **Migration RAG de la génération de jeux** : Mise à jour du frontend (`genererJeu` dans `AdminIA.tsx`) pour qu'il intègre le `schema` de validation stricte requis par la route `/api/gemini/generate-json-rag`. Le payload transmet correctement le contexte RAG et produit un JSON structuré valide pour le moteur SRS.
- **Backend RAG (Retrieval-Augmented Generation)** : Implémentation du pipeline d'ingestion et de recherche vectorielle en mémoire (`/api/gemini/rag-ingest`, `/api/gemini/generate-lesson-rag`) utilisant `text-embedding-004` et la similarité cosinus, posant les bases de la Phase 14.1 (Knowledge to Course).
- **Scaffolding RAG** : Intégration du RAG pour la génération de l'architecture d'application (Scaffolding). Création de la route `/api/gemini/generate-scaffold-rag` et raccordement au frontend (`AdminIA.tsx`). Le frontend ne stocke plus le contenu massif des documents en mémoire, allégeant drastiquement le state.
- **Planification des Profils de Recherche** : Ajout à l'architecture globale des intentions d'intégration d'APIs externes (Perplexity, YouTube, Scite.ai, etc.) pour enrichir le RAG avec des données web en temps réel.
- **R3 & R11 - IA Partenaire Pédagogique et Validation avant publication** : Refonte de l'assistant IA de création (`DataGeneratorModal`). L'IA ne se contente plus de générer des éléments ; elle endosse le rôle de "Partenaire Pédagogique" en simulant un apprenant naïf pour détecter les sauts logiques, en classifiant la profondeur cognitive des concepts, et en identifiant d'éventuelles redondances (R11). Une étape de revue et de validation manuelle explicite a été instaurée avant toute publication (R3).
- **R1 - Détecteur de blocage conceptuel** : Intégration d'un mécanisme dans le moteur SRS pour distinguer un échec mémoriel (oubli) d'un échec de compréhension (blocage conceptuel). Si un item est échoué 3 fois consécutivement (`consecutive_lapses >= 3`), il est désormais marqué comme `is_blocked`.
- **R2 - Dashboard Mémoriel Honnête** : Création du nouvel écran `DashboardMemorielScreen` accessible depuis le Profil (Portefeuille). Cet écran offre une transparence totale sur la rétention en catégorisant les items en "Concepts Solides", "Concepts Fragiles" et "Concepts Non Testés", en y intégrant les items bloqués par incompréhension.
- **R12 - Tuteur IA Honnête et Connecté (Étapes 1 et 2)** : Le composant `AITutorChat` a été mis à jour. Étape 1 : Le tuteur est connecté aux échecs récents de la session SRS pour fournir un contexte précis ("L'apprenant a eu des difficultés avec..."). Étape 2 : Le tuteur affiche désormais explicitement ses limites à l'ouverture du chat, se présentant comme une aide ponctuelle et non un mentor global.
- **Tests Unitaires (Vitest)** : Implémentation d'une suite de tests unitaires avec Vitest pour valider la logique métier pure (`calculateRevenueSplits` dans `revenue.ts`) et les stores Zustand complexes (`useTenant.ts` avec mocks Firestore). Ajout des scripts `test:ci` et `test:coverage` pour faciliter l'intégration continue.
- **Monitoring des erreurs avec Sentry** : Intégration complète de Sentry sur le backend (Express) et le frontend (React) pour capturer les erreurs de production. Testé et validé via des endpoints de debug (`/api/debug-sentry`).
- **Sécurisation via Firebase App Check** : Implémentation d'App Check avec reCAPTCHA v3 (`ReCaptchaV3Provider`) sur le client et validation via middleware (`requireAppCheck`) sur le serveur Express pour protéger nos endpoints API de tout trafic abusif. Un utilitaire `secureFetch` a été ajouté pour intégrer les tokens automatiquement aux requêtes API depuis le front.
- **Tableau de Bord des Redevances (Royalties)** : Création de la vue `AdminRoyalties.tsx` permettant au SuperAdmin et aux locataires B2B de visualiser l'historique des transactions, les partages de revenus et le solde dû pour chaque créateur selon le modèle `RevenueShareAgreement`. Intégration de KPIs financiers en temps réel.
- **Logique Serveur pour les Transactions** : Implémentation des endpoints backend (`/api/revenue/transactions`, `/api/revenue/ledgers`, `/api/revenue/process-transaction`) pour calculer et répartir automatiquement les paiements entre la plateforme et les créateurs avec enregistrement atomique dans Firestore.
- **Authentification Réelle et Gestion des Rôles (Firebase Auth)** : Remplacement de l'authentification mockée par Firebase Auth (`signInWithEmailAndPassword` et Google Auth). Implémentation complète du RBAC côté client via Zustand (`useAuth`) qui extrait et stocke les Custom Claims Firebase (`superadmin`, `admin`, `creator`) pour adapter dynamiquement l'interface d'administration (masquage d'onglets pour les simples créateurs).
- **Refonte du Routeur Client (React Router)** : Remplacement complet du système de navigation basé sur l'état local (`currentScreen`) par `react-router-dom`. Ajout du support pour les vraies URLs, l'historique du navigateur (bouton retour), le deep-linking (liens directs vers `/game/:id`, `/lesson/:id`), et création d'un wrapper `ProtectedRoute` pour encapsuler la vérification d'authentification et de l'onboarding.
- **Découpage Zustand (Slices Pattern)** : Refactorisation majeure du fichier `useProgression.ts` (précédemment plus de 700 lignes) en de multiples slices (modules) spécialisés : `economySlice`, `settingsSlice`, `inventorySlice`, `statsSlice`, `coursesSlice` et `syncSlice`. Les types et constantes ont été extraits dans `progressionTypes.ts` et `progressionConstants.ts` pour une maintenance simplifiée, sans casser l'interface existante.
- **Lazy Loading et Composant d'attente (Suspense)** : Intégration de `React.lazy` dans `App.tsx` pour charger les principaux écrans (Admin, Parcours, Boutiques, Scénarios, etc.) uniquement lorsqu'ils sont affichés. Ajout du composant générique `LoadingSpinner` comme `fallback` de `<Suspense>`, réduisant ainsi le poids du bundle JavaScript initial.
- **Sécurité et Isolation Multi-Tenant (RBAC)** : Implémentation complète de l'isolation par `tenantId` dans les règles Firestore (`firestore.rules`). Les requêtes sont désormais strictement cloisonnées.
- **API Serveur Custom Claims** : Création d'endpoints sécurisés (`/api/admin/bootstrap`, `/api/admin/members/invite`) pour attribuer de vrais rôles Firebase Auth (Custom Claims) tels que `superadmin`, `admin`, ou `creator`.
- **Persistance Admin Multi-Tenant** : Migration de l'enregistrement et de la lecture des scénarios, de la configuration globale et des forfaits de l'application sous l'arborescence `/tenants/{tenantId}/`. L'interface d'administration est maintenant connectée aux données réelles et isolées.
- **Hub Créateur (Cours & Bundles)** : Création de la vue `AdminCreatorHub.tsx` pour permettre aux formateurs et administrateurs d'assembler des modules en *Cours*, et des cours en *Bundles*. Intégration d'une interface claire avec navigation par onglets pour gérer ses produits, voir les statuts (brouillon/publié), et filtrer par titre.
- **Gestion des Membres et Formateurs (Admin)** : Création de la nouvelle interface `AdminMembers.tsx` intégrée au tableau de bord d'administration B2B. Cette vue permet aux locataires (tenants) d'inviter des collaborateurs, de leur attribuer des rôles (Créateur, Admin, Employé, Support) et de consulter leur statut.
- **Interface de Partage de Revenus (Creators)** : Ajout d'une fonctionnalité de simulation et de configuration des pourcentages de partage de revenus pour les formateurs/créateurs directement depuis le panneau des membres.
- **Modèle RBAC Multi-Comptes (`TenantMember`)** : Ajout d'une gestion granulaire des rôles au sein d'un même espace de marque blanche (Owner, Admin, Creator, Employee, Support), permettant aux clients d'inviter des formateurs et des collaborateurs.
- **Partage de Revenus (`RevenueShareAgreement`)** : Implémentation du modèle de données pour supporter les contrats de partage de revenus, permettant de rétribuer automatiquement les créateurs (montant fixe ou pourcentage) sur les ventes de cours ou bundles.
- **Pages de vente adaptatives Astro** : Création de pages de destination générées dynamiquement pour les cours (`/[tenant]/course/[courseId]`) et les bundles (`/[tenant]/bundle/[bundleId]`). Ces templates intègrent des designs prémium distincts (clair pour les cours individuels, "Dark Mode Premium" pour les bundles) et exploitent les données structurées SEO. Les couleurs des pages s'adaptent automatiquement au thème défini par le locataire dans Firestore (via `tenantConfig.theme`).
- **Modèles de données Multi-Cours & Monétisation** : Découplage de l'entité de monétisation et de la structure pédagogique. Ajout des types `Course`, `Bundle`, `Product`, `Entitlement`, et `UserCourseProgression` dans `src/types/index.ts`.
- **Progression Indépendante (Multi-parcours)** : Mise à jour du store `useProgression` pour supporter la progression individualisée par cours (`courseProgressions`) au lieu d'un seul parcours global.
- **Gestion des Droits d'Accès** : Ajout du système d'entitlements dans le store global permettant de débloquer des cours et de valider les accès de manière sécurisée.
- **Planification des fonctionnalités d'adhésion multi-cours** : Analyse et conception d'une architecture modulaire pour soutenir la vente de cours individuels, de bundles et de tarification par niveaux.

### Sécurité & Correctifs (Unreleased)
- **Finalisation de la Phase 0 — Sécurité & hygiène** :
  - **Éradication de l'email superadmin codé en dur** : Suppression complète de toutes les occurrences de l'adresse email de superadmin en dur (`bastienp2014@gmail.com`) dans `server.ts`, `firestore.rules` et `syncSlice.ts`.
  - **Sécurisation des endpoints de debug** : Désactivation de `/api/debug-sentry` en production. Authentification requise (`requireAuth`) pour `/api/debug/error`, avec limitation de taille (50 Ko) et rotation des logs (max 5 Mo) pour protéger l'espace disque. Mise à jour du frontend pour inclure le token Firebase dans les en-têtes d'autorisation.
  - **Purge de la dette technique et des fichiers morts** : Suppression définitive des résidus : `fix.js`, `scripts/directus-setup.cjs`, `scripts/out.txt`, `tsconfig.tsbuildinfo`, répertoire `design_handoff_theme_system/` (archivé), `client_errors.log`. Suppression du script `db:push` dans `package.json`.

### Optimisé / Modifié
- **Performance (Zustand)** : Migration massive vers les sélecteurs stricts Zustand (`useProgression(s => s.property)`) dans de nombreux composants (HUD, AudioPlayer, écrans de jeu, admin) pour éviter les re-rendus inutiles en chaîne.
- **Découpage Architectural & Améliorations UI** : Scission de l'immense composant `AdminScreen` en sous-composants plus maintenables. Extraction de `AdminDataTab` pour gérer l'édition des listes de données, avec un affichage adaptatif optimisé en grille (1 à 3 colonnes) pour un meilleur confort visuel lors de la gestion du contenu.

## [0.2.0] - 2026-06-27

### Ajouté
- **Balisage structuré JSON-LD (Astro)** : Création d'un composant de balisage de données structurées `<Schema />` pour le site vitrine Astro (`marketing-site`), améliorant la lisibilité par les crawlers de recherche et d'IA.
- **Utilitaire SEO Dynamique** : Ajout de `generateSEOMetaTags` pour centraliser et unifier la génération des titres, descriptions, mots-clés et données OpenGraph à partir des configurations multi-tenant de Firestore.
- **Intégration Astro-SEO** : Connexion réussie du composant d'injection SEO d'Astro avec le layout de marque blanche (`TenantLayout.astro`).

### Modifié
- **Thématisation Astro** : Correction de l'accès aux variables de thème (`tenantConfig.theme.primary` au lieu de l'ancienne clé imbriquée obsolète).

### Sécurité & Correctifs
- **Résolution d'erreurs d'exécution serveur (ESM)** : Éradication de l'erreur `ReferenceError: require is not defined` dans le script d'entrée du serveur `server.ts` en remplaçant l'appel dynamique `require('fs')` par un import statique ES standard `fs`.
- **Journalisation robuste des erreurs client** : Mise à jour de la route `/api/debug/error` pour écrire proprement les erreurs du navigateur dans `client_errors.log` de manière asynchrone sans bloquer la boucle d'événements du serveur.

## [0.1.0] - Fondations (Historique)

### Ajouté
- **Moteur de Mécaniques** : Implémentation des jeux interactifs de base (QCM, Glisser-déposer, Cartes mémoires, Texte à trous).
- **Marque Blanche (Whitelabel)** : Système de thématisation dynamique permettant aux locataires de configurer leurs couleurs, typographies et branding.
- **Gestionnaire d'IA** : Intégration de Gemini pour l'assistance à la création de leçons et la génération de données pédagogiques.
- **Tableau de Bord Administrateur** : Interface centrale (`AdminScreen`) permettant de configurer la progression, les parcours, les tags et les statistiques.
- **Gamification** : Algorithmes de progression de l'apprenant, gestion de l'XP et système de badges personnalisables.
## [2026-07-01]
### Changed
- Refactored `17_CombinationBuilder.tsx` through `25_AudioAB.tsx` in `src/mechanics/` to remove all instances of `any`. Replaced with strictly typed logic and `NonNullable<Data['prop']>[number]` where applicable. Validated with ESLint.

