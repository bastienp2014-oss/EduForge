# Plan d'Action Global

## Phase 1 : Les Fondations Visuelles et Architecturales (Terminé)
- [x] **Éradication des styles "en dur"** : Utilisation des tokens dynamiques de `useTheme` (Côté Client).
- [x] **Thématisation de l'Administration** : Création et application de `useAdminTheme` pour le tableau de bord (Terminé).
- [x] **Standardisation du Gabarit de Jeu** : `GameHUD`, `GameProgress`, `GameButton`, `GameResult` sont purs et utilisent `useTheme` (Zone C prête).
- [x] **Configuration Dynamique de l'App (`useAppConfig`)** : Création d'un store permettant de gérer dynamiquement les noms, icônes et visibilité des sections principales de l'app.

## Phase 2 : Le Cerveau Pédagogique & Architecture Multi-Tenant (En cours)
- [x] **Registre des Jeux Centralisé** : Index dynamique des jeux finalisé pour que la section "Arcade" se génère toute seule (`useGames.ts`, `ArcadeScreen.tsx`, `DynamicGameScreen.tsx`).
- [x] **Monnaie & Éléments Dynamiques** : Configuration globale de devise (`useCurrency`, `useAppConfig` mis à jour).
- [x] **Feature Flags & Marque Blanche** : Permissions granulaires pour l'accès aux fonctionnalités (`useAppConfig`, `Admin` UI mis à jour).
- [x] **Réorganisation du Panel Admin** : Distinction entre SuperAdmin (Plateforme) et Admin Client (Whitelabel).
- [x] **Gestion des Rôles & Accès** : Mettre en place la distinction stricte entre le rôle "SuperAdmin" (moi) et "Client Whitelabel" (Accès paramétrage, thèmes, feature flags).
- [x] **Généralisation de la Taxonomie** : Remplacer les catégories figées par un système de tags génériques ("Vocabulaire", "Leçon 1") configurables par l'admin.
- [x] **Tags de Compatibilité** : Ajouter des métadonnées au contenu pour indiquer à quels jeux ils s'appliquent (ex: `["pendu", "quiz"]`).
- [x] **Connexion Jeux ↔ SRS** : Mettre à jour les mécaniques pour qu'elles demandent au moteur SRS : "Donne-moi X éléments à réviser", au lieu de lire un JSON fixe.
  - [x] Connecter `DynamicGameScreen` (et le composant `FlashcardSRS`) au `useSrs`.
  - [x] Rendre les autres mécaniques (Pendu, Quiz, etc.) compatibles avec les données SRS.
  - [x] Gérer l'enregistrement des résultats (succès/échecs) de chaque mécanique vers le SRS.

## Phase 3 : L'Assistant IA Omniprésent et Personnalisé (Terminé)
- [x] **Configuration BYOK** : Interface pour fournir sa propre clé API Gemini (Implémentée dans AdminIA).
- [x] **Profil de l'IA paramétrable** : Interface pour définir le persona et le texte de contexte.
- [x] **Base de Connaissances (RAG)** : Interface pour téléverser des documents (PDF, Word, TXT) afin d'alimenter le contexte de l'IA dans l'admin. (Upload géré par `multer` + parsing côté serveur)
- [x] **Génération d'images et de mini-jeux** (BGC implémentés).
- [x] **Autres Boutons de Génération Contextuelle (BGC)** : Intégration de l'IA dans l'Admin pour la génération de mots (vocabulaire) et de succès.
- [x] **Assistant IA Joueur** : Intégration d'un chat IA contextuel pendant les jeux/leçons pour expliquer les erreurs ou donner des exemples.
- [x] **Générateur IA de Parcours thématiques** : Proposer instantanément des structures de chapitres et leçons sur mesure.
- [x] **Super Assistant IA (App Creator clé-en-main)** : Métamorphoser toute l'identité (Nom, Slogan, Palette de couleurs), créer le curriculum de leçons complet, et générer le vocabulaire thématique en 1 clic.

## Phase 4 : Hub Pédagogique, Moteur SRS & Mécaniques de Jeux (Terminé)
- [x] **Hub Pédagogique Centralisé** : Rassembler tout le contenu pédagogique dans une base globale indépendante des mécaniques de jeu (Structure `ContentItem` et adaptation du `contentProvider` terminées).
- [x] **Migration des Mécaniques** : Refactorisation des mécaniques principales (Flashcard, QCM, Pendu, Swipe) pour qu'elles consomment le format universel `ContentItem`.
- [x] **Matrice de Compatibilité Contenu ↔ Jeux** : Enforcer le filtrage lors de la génération de session SRS (ex: empêcher une phrase de se retrouver dans le Pendu).
- [x] **Gestionnaire de Tags (Tag Manager)** : Système robuste pour étiqueter les contenus afin de permettre au moteur SRS de piocher intelligemment les révisions.
- [x] **Sélection Dynamique par l'Utilisateur** : Permettre à l'apprenant de choisir la mécanique de jeu de son choix pour réviser un set de contenu défini par le moteur SRS (et filtré par la compatibilité).

## Phase 4.1 : Structuration des Parcours et Théorie (Terminé)
- [x] **Leçons Théoriques** : Création d'écrans d'apprentissage purs (textes, vidéos, grammaire) sans mécanique de jeu immédiate, servant de pré-requis.
- [x] **Parcours Thématiques Imposés** : Capacité à forcer un sujet (ex: anglicismes) dans un module spécifique, tout en laissant le choix du jeu ou en imposant un jeu.
- [x] **Chemin de Progression Visuel (Apprenant)** : Réintégration de la vue "Timeline" (façon Duolingo) sur l'écran d'accueil pour visualiser clairement son avancée à travers les niveaux personnalisés.
- [x] **Éditeur de Parcours Linéaire (Admin)** : Interface simple pour ordonner les niveaux, chapitres et leçons et configurer les tags, théories et mécaniques de jeu.
- [x] **Conditions de passage** : Intégration d'indicateurs de réussite (leçons terminées) et planification instantanée dans le moteur SRS lors du visionnage.

## Phase 5 : Déploiement Whitelabel, Facturation & Infrastructure
- [x] **Authentification et Gestion des Rôles avancée** : Sécurisation des accès via un vrai système d'authentification (ex: Firebase Auth) séparant SuperAdmin, Clients Whitelabel et Utilisateurs finaux.
- [x] **Domaines Personnalisés** : Permettre aux clients Whitelabel de connecter leur propre nom de domaine.
- [x] **Tableau de Bord Financier (SuperAdmin & Whitelabel)** : Espace dédié avec graphiques (Recharts) pour suivre l'acquisition, la rétention, les conversions et le MRR (Implémenté dans AdminStats).
- [x] **Monétisation et Configuration des Forfaits** : Gestion dynamique des prix, limites gratuites et avantages du Paywall (Implémenté dans AdminForfaits).

## Phase 6 : Marketing & Site Vitrine (Côté React / Headless CMS) (Terminé)
- [x] **Générateur de Site Promotionnel** : Modèle "clé en main" intégré au tableau de bord (AdminWebsite) pour configurer la landing page, ses sections et ses mockups.
- [x] **Stratégie SEO Pédagogique (Headless CMS)** : Interface d'administration pour choisir les leçons et les glossaires à exposer publiquement sur le site vitrine pour générer du trafic SEO organique. L'application React agit comme un Headless CMS.
- [x] **Tableau de Bord SEO (Multi-Tenant)** : Espace d'administration complet (`AdminSEO.tsx`) pour analyser le trafic, les impressions, les requêtes et les taux de clics (GSC/GA4 simulés) et le classement des locataires, sans pénaliser les performances de l'app.
- [x] **Interactive Teaser** : Création d'un wrapper de mini-jeu jouable avec gestion de temps/nombre de coups et un paywall/call-to-action personnalisable.
- [x] **Prévisualisation Landing Page (Vue Apprenant)** : Injection dynamique du teaser avec sa propre configuration, distincte du mode démo client/B2B.

## Phase 7 : Déploiement Vitrine & Architecture Astro (Terminé)
- [x] **Architecture Multi-Tenant & SSR (Astro)** : Mise en place d'Astro avec le rendu côté serveur (SSR) pour servir dynamiquement les sites B2B (clients finaux) et le site SuperAdmin (SaaS) avec une seule base de code.
- [x] **Balisage Structuré (Schema.astro)** : Intégration de balises de données structurées JSON-LD (`Schema.astro` et utilitaire de génération de métadonnées SEO) pour optimiser le référencement naturel et la lecture par les robots et les IA.
- [x] **Composants Astro UI** : Création des Hero, Features, Pricing et Footer optimisés pour les performances.
- [x] **SEO Hybride & Squelette SEO** : Mise en place du package `astro-seo` (`TenantLayout.astro`) et rédaction de l'architecture programmatique SEO (Planificateur d'URL IA).
- [x] **Synchronisation de la Marque & Données (Backend)** : Astro va consommer l'état réel et la configuration (Couleurs, Nom, Textes SEO) depuis notre base de données (ex: Firebase).
- [x] **Astro Islands (Ilôts Interactifs)** : Intégration des mini-jeux React (`InteractiveTeaser`, `DeviceFrame`) directement dans les landing pages Astro via la directive `client:idle` ou `client:visible`.
- [x] **Moteur SEO / GEO Automatisé** : Génération asynchrone des landing pages par niche ou ville avec l'IA.
- [x] **Sitemap Dynamique (Astro)** : Génération automatique des `sitemap.xml` par tenant pour exposer les landing pages SEO au crawlers.

## Phase 8 : Architecture de Monétisation Flexible (Cours, Bundles, Produits)
- [x] **Découplage Modèle de Données (Produits & Contenu)** : Séparer l'entité de monétisation (`Product`) de la structure pédagogique (`Course` > `Module` > `Lesson`).
- [x] **Gestion des Bundles & Niveaux Payants** : Permettre de créer des produits qui accordent l'accès à plusieurs cours (bundles), à un cours complet, ou à des modules/niveaux spécifiques.
- [x] **Progressions Indépendantes** : Séparer la progression de l'apprenant par "Cours" plutôt qu'une progression globale unique, permettant à un utilisateur de suivre plusieurs parcours simultanément.
- [x] **Gestion des Droits d'Accès (Entitlements)** : Vérifier l'accès à un contenu (leçon/module) en fonction des achats de l'utilisateur avant d'autoriser le démarrage.
- [x] **Espace Créateur (Cours & Bundles)** : Interface d'administration pour permettre à un formateur d'assembler des cours à partir de modules existants, et des bundles à partir de cours.
- [x] **Pages de Vente Adaptatives** : Création de landing pages générées dynamiquement pour présenter et vendre des cours individuels ou des bundles (description, contenu inclus, tarification).

## Phase 9 : Collaboration, RBAC & Partage de Revenus
- [x] **Modèle de Données RBAC (`TenantMember`)** : Création de l'interface `TenantMember` pour gérer les membres d'un tenant avec des rôles distincts (Owner, Admin, Creator, Employee, Support).
- [x] **Modèle de Partage de Revenus (`RevenueShareAgreement`)** : Mise en place des contrats de partage de revenus, permettant de définir des pourcentages ou montants fixes par produit et par créateur.
- [x] **Gestion des Membres (Admin)** : Interface d'administration permettant d'inviter de nouveaux collaborateurs et de gérer leurs rôles (via `AdminMembers.tsx`).
- [x] **Espace Formateur/Créateur** : Tableau de bord dédié aux créateurs pour gérer les accès et configurer/générer leurs cours et bundles (via `AdminCreatorHub.tsx`).
- [x] **Calcul Automatique des Redevances** : Logique de répartition des gains lors d'un achat selon les `RevenueShareAgreement` actifs.

## Assistant IA & Versatilité (App Scaffolding)
- [x] **Configuration BYOK** : Interface pour fournir sa propre clé API Gemini (Implémentée dans AdminIA).
- [x] **Personnalisation des Prompts et Contexte** : Interface permettant de modifier la personnalité (System Prompt), la base de connaissances (Contexte additionnel), et d'ajouter des documents personnalisés pour rendre l'assistant complètement agnostique et versatile.
- [x] **Scaffolding / Générateur d'Application Complète** : Interface d'administration permettant de configurer un "Prompt de génération d'Application" afin que l'IA puisse générer l'architecture entière d'une nouvelle instance de l'application (leçons, arborescence, thème visuel, nom) en un seul clic.

## Phase 10 : Qualité, Audits & Tests Systèmes (Terminé)
- [x] **Audit de l'Architecture et Structure du Code** : Analyse du découplage des composants, de la gestion globale de l'état (Zustand) et de l'organisation des dossiers pour identifier les redondances ou les goulots d'étranglement de maintenance.
- [x] **Audit UX/UI et Accessibilité** : Vérification de la cohérence visuelle, des contrastes, du responsive design, et des parcours utilisateurs (onboarding, navigation) pour s'assurer qu'il n'y a pas de friction.
- [x] **Audit de Sécurité et Modèle RBAC** : Simulation de tentatives d'accès non autorisées, analyse des règles de sécurité Firebase (`firestore.rules`) et vérification de la robustesse des rôles (SuperAdmin, Admin, Creator, etc.).
- [x] **Simulations de Performance et Gestion de l'État** : Tests sur la performance des rendus React (évitement des re-renders inutiles), la gestion du cache et l'optimisation des appels réseau (notamment lors de l'utilisation des mécaniques de jeu).
- [x] **Audit Fonctionnel et Edge Cases** : Tests systématiques des flux critiques de bout en bout (création d'un bundle, parcours d'apprentissage, achat, et calcul des redevances) en incluant les cas d'erreur réseau et les états de chargement.

## Phase 11 : Remédiation Audit (Sécurité et Fondations)
- [x] **Urgence Absolue (Sécurité du serveur et des règles Firestore)** :
  - [x] Authentifier + rate-limiter les endpoints `server.ts`.
  - [x] Réécrire `firestore.rules` en deny-by-default ; verrouiller `read` sur `tenants/configuration/scenarios`.
  - [x] Rendre la valeur économique (premium, entitlements, piasses) en lecture seule côté client et la déplacer côté serveur.
  - [x] Retirer le sélecteur de tenant public et le faux gate admin.
- [x] **Urgence Haute (Fondations B2B)** :
  - [x] Custom claims + vrai RBAC Firebase.
  - [x] Isolation complète du Tenant (Cloisonnement des requêtes et règles Firestore).
  - [x] Persister réellement membres et contenu admin (Scénarios, Configuration, Forfaits migrés sous `tenantId`).
  - [x] Brancher analytics et monitoring (Sentry + App Check intégrés).
- [x] **Urgence Moyenne (Performance & Robustesse)** :
  - [x] Découper les méga-composants admin (`AdminScreen` refactorisé avec `AdminDataTab`, et ajout d'une grille adaptative à 3 colonnes).
  - [x] Optimisation des rendus via les sélecteurs stricts Zustand (`useProgression`, `useTenant`, `useGames`).
  - [x] Découper le méga-store `useProgression` en slices Zustand.
  - [x] Lazy loading des écrans + debounce des sauvegardes.
  - [x] Introduire Vitest sur les modules purs ; activer ESLint en CI.
- [x] **Assainissement "Gold Standard" (Typage strict et suppression de `any`)** :
  - [x] `01_FlashcardSRS` à `16_ChainReaction` (Terminé)
  - [x] `17_CombinationBuilder` à `25_AudioAB` (Terminé)
- [ ] **Reportable (UX & Qualité)** :
  - [x] Refonte du routeur en de vraies URLs via React Router (Historique, deep-linking).
  - [ ] i18n réel, virtualisation des listes, unification fine du Design System, accessibilité avancée.

## Phase 12 : Alignement stratégique EdTech (Recommandations de la Recherche Produit)

Cette phase regroupe l'implémentation des fonctionnalités issues de l'étude comparative des plateformes LMS (Kajabi, Teachable, LearnWorlds) et des retours utilisateurs 2025-2026.

### 1. Notes Privées de l'Apprenant (Student Notes)
- [ ] **Tâche** : Implémenter un volet de prise de notes persistantes pour les apprenants.
  - **Quoi** : Un bloc d'édition de texte riche accessible sur l'écran d'apprentissage (`LessonGameScreen` et mécaniques) permettant à l'apprenant de sauvegarder ses propres annotations sous la leçon.
  - **Comment** : Créer un store `useNotes` (Zustand) connecté à Firestore (`tenantId_studentNotes`), avec un composant `PrivateNotesWidget` collapsible et une sauvegarde automatique débouclée à chaud.
  - **Pourquoi** : Répond à la **Priorité 5** de la recherche (les étudiants ont besoin de centraliser leurs notes sans outils externes comme OneNote, augmentant la rétention d'information et l'engagement).

### 2. Module d'Analytics Actionnables (Dashboard IA Pédagogique)
- [ ] **Tâche** : Transformer les dashboards descriptifs en moteur de recommandations proactives pour l'administrateur.
  - **Quoi** : Des cartes de recommandations "Smart Actions" ("Leçon 3 bloque 35% des apprenants : simplifier", "L'élève X est inactif depuis 10 jours : envoyer un rappel").
  - **Comment** : Dans `AdminStats` et `AdminSEO`, analyser statistiquement les données de progression (`useProgression` et résultats des jeux) et de rétention, puis utiliser un prompt ciblé Gemini pour générer des suggestions d'optimisation pédagogique concrètes.
  - **Pourquoi** : Répond aux **Priorité 3 et Priorité 11** de la recherche (les analytics traditionnels des LMS concurrents sont jugés trop passifs et non actionnables pour piloter une académie).

### 3. Transcript Académique Unifié & Certificats de Fin de Parcours
- [ ] **Tâche** : Système de certification officiel et de suivi d'activité formel téléchargeable.
  - **Quoi** : Un tableau de bord regroupant l'historique complet, les dates de complétion, les scores, et la possibilité d'exporter un relevé de notes officiel ou un certificat de réussite.
  - **Comment** : Créer une vue `StudentTranscript` et un utilitaire d'export PDF, sécurisés côté serveur, qui compilent l'historique de progression et de réussite du moteur SRS.
  - **Pourquoi** : Répond aux **Priorité 4 et Priorité 7** de la recherche (les organisations B2B et les apprenants sérieux exigent des preuves tangibles de formation et des documents de complétion de qualité "académique").

### 4. Diagnostics Pédagogiques & Pré/Post-tests Adaptatifs
- [ ] **Tâche** : Évaluation initiale et certificative non binaire.
  - **Quoi** : Intégrer un flux de "Test de positionnement" (pré-test) à l'onboarding pour débloquer automatiquement les niveaux appropriés, et un "Examen final" (post-test) pour valider l'acquisition de compétences.
  - **Comment** : Créer des configurations de quiz spécifiques (`isPlacementTest`, `isFinalExam`) dans notre base de données et adapter le `contentProvider` pour ajuster le score initial du SRS de l'apprenant.
  - **Pourquoi** : Répond à la **Priorité 9** de la recherche (les utilisateurs demandent une évaluation plus intelligente et adaptative que le simple scoring binaire de fin de leçon).

### 5. Cartographie par Compétences (Skill Graph Mapping)
- [ ] **Tâche** : Visualisation de l'apprentissage par graphe de compétences.
  - **Quoi** : Une interface apprenant montrant un graphe interactif ou un arbre de compétences acquises/en cours (ex: "Vocabulaire courant", "Grammaire de base"), au lieu d'une simple suite chronologique.
  - **Comment** : Structurer des liaisons entre les tags de contenus et un dictionnaire de compétences définies par l'admin, puis afficher un graphe SVG interactif d3.js dans l'espace apprenant.
  - **Pourquoi** : Répond à l'innovation stratégique **Skill graph + progression** de la recherche (valoriser l'apprentissage par la compétence pour attirer les clients corporatifs B2B).

## Phase 13 : Recommandations d'Architecture (Rapport Claude) - (En cours)

Cette phase est priorisée pour transformer le socle mémoriel en véritable outil de mesure et de développement de la compréhension (vers la création pédagogique de grande qualité), en laissant de côté les couches communautaires complexes.

### Phase 13.1 : Fondations de la distinction mémoire/compréhension (Terminée)
- [x] **R1 : Détecteur de blocage conceptuel** : Distinguer un "échec par oubli" (nécessitant plus de répétition) d'un "échec par incompréhension" (nécessitant une autre approche).
  - *Implémenté via `consecutive_lapses` et `is_blocked` dans le moteur SRS.*
- [x] **R2 : Dashboard Mémoriel Honnête** : Création d'une interface utilisateur dédiée offrant une transparence totale sur la rétention (Concepts Solides, Fragiles, Incompris).
  - *Implémenté via `DashboardMemorielScreen`.*
- [x] **R12 : Tuteur IA Honnête et Connecté (Étapes 1 & 2)** :
  - *Étape 1* : L'IA a accès au contexte d'apprentissage réel de la session (les concepts en échec récent) pour fournir une aide ciblée.
  - *Étape 2* : L'interface du tuteur affiche clairement ses limites pour ne pas créer de fausses attentes ("Tuteur ponctuel" vs "Mentor global").
- [x] **R3 : Validation IA avant publication** : Ajouter une étape de vérification automatisée puis humaine avant la publication de tout contenu généré par l'IA.
  - *Implémenté dans `DataGeneratorModal` en demandant validation explicite après analyse.*

### Phase 13.2 : Développement de la compréhension (En cours)
- [x] **R11 : IA Créateur : De Générateur à Partenaire Pédagogique** : Utiliser l'IA pour simuler un "apprenant naïf" afin de détecter les sauts logiques du formateur, classifier la profondeur cognitive, et détecter les redondances de contenu.
  - *Implémenté avec R3 dans `DataGeneratorModal` (Analyse du partenaire pédagogique).*
- [ ] **R4 : Mécanique de Génération (26e mécanique)** : Tester la capacité à produire (expliquer, justifier) plutôt que de simplement rappeler, afin de mesurer la compréhension réelle.
- [ ] **R6 : Vue Réseau Conceptuel (Optionnel)** : Visualisation sous forme de graphe des relations (prérequis, oppositions) entre concepts enseignés.
- [ ] **R7 : Scénario Ramifié Étendu (Optionnel)** : Étendre la mécanique de dialogue à de vraies simulations de décision professionnelle (conséquences différées).

### Phase 13.3 : Signal de compétence et preuve (À venir)
- [ ] **R5 : Défis de Transfert (Transfer Challenges)** : Simuler des tâches non planifiées combinant plusieurs concepts pour tester la compétence réelle d'application ("Far transfer").
- [ ] **R9 : Évaluation Authentique (Evidence Portfolio)** : Collecter et consolider les preuves réelles (réponses ouvertes R4, décisions R7, défis de transfert R5) plutôt que de réduire l'évaluation à un simple "Score de complétion".
- [ ] **R10 : Portabilité du Parcours (Optionnel)** : Export des données et émission de certificats ouverts/vérifiables (Open Badges).

### Phase 14 : Génération Profonde ("Deep Generation") & Écosystème Avancé

Cette phase concrétise la vision d'une IA omniprésente capable de générer l'intégralité d'un cours (RAG), de ses supports d'évaluation, et de l'écosystème marketing qui l'entoure. L'objectif est de s'éloigner du workflow classique de création manuelle au profit d'une "Génération Profonde" guidée par l'utilisateur.

### 14.1 : Architecture "Knowledge to Course" (RAG)
- [x] **Upload & Ingestion** : Interface (`AdminIA.tsx`) pour téléverser divers formats de documents servant de source de vérité stricte.
- [x] **Pipeline RAG (Retrieval-Augmented Generation)** : Indexation vectorielle du contenu. L'IA s'appuie exclusivement sur ce contexte pour empêcher les hallucinations.
- [x] **Scaffolding (Le "Gros JSON")** : Génération globale d'une application clé-en-main (Thème, Couleurs, Syllabus) centralisée dans `AdminIA.tsx`.
- [ ] **Génération Pédagogique Granulaire** : Édition fine du syllabus (`AdminParcours.tsx`) avec génération de leçons et d'exercices spécifiques (Quiz, Flashcards) s'appuyant sur le RAG.
- [x] **Couche Marketing & Contenu Profond** : Intégration dans le Scaffolding de la génération des slogans, descriptions et du vocabulaire initial.

### 14.2 : Moteur de Gamification Dynamique & Choix des Mécaniques
- [ ] **Mapping de Compatibilité Intelligent** : Lors de la génération de l'évaluation, l'IA catégorise le contenu et assigne automatiquement les mécaniques jouables compatibles (Ex: "Vocabulaire" -> Flashcards, Bingo ; "Grammaire" -> QCM, Déduction).
- [ ] **Sélecteur de Jeux Flexibles (Créateur & Apprenant)** : 
  - Le créateur se voit proposer un jeu par défaut mais peut "switcher" pour un autre jeu compatible.
  - L'apprenant (si l'admin l'autorise) peut choisir de réviser un module via la mécanique de son choix (ex: réviser les conjugaisons en jouant au "Pendu" ou en "Cartes Mémoire").

### 14.3 : Écosystème Marketing & SEO Automatisé (Astro)
- [ ] **Génération du Site Vitrine Astro par l'IA** : L'IA analyse le contenu du cours généré et rédige intégralement les pages de ventes (Hero, Bénéfices, Témoignages, Tarifs).
- [ ] **Moteur d'Optimisation SEO Natif** : 
  - Génération automatisée des balises meta, JSON-LD schema.org, et ciblage des mots-clés de longue traîne.
  - Création programmatique par l'IA de multiples pages d'atterrissages (Landing Pages par niche/ville).
- [ ] **Design Assisté par Persona** : L'utilisateur définit un persona et une ambiance (ex: "Corporate", "Zen", "Tech"). L'IA en déduit automatiquement la charte graphique, les visuels (logos, bannières générés), et les textes marketing.

### 14.4 : Leaderboards & Engagement
- [ ] **Classements Dynamiques (Leaderboards)** : Introduction de systèmes de points compétitifs ou collaboratifs.
- [ ] **Filtres de Cohortes** : Leaderboards globaux, par session de cours, ou par groupes d'amis/entreprise pour encourager l'engagement sans décourager les nouveaux.

### 14.5 : Feature Flags Avancés & Modèle de Monétisation
- [ ] **Accès Basé sur les Rôles et Forfaits (Feature Flags)** : L'IA et l'infrastructure limitent l'accès aux fonctionnalités selon le "Tier" du tenant (Gratuit, Pro, Entreprise).
- [ ] **Monétisation de la Génération** : 
  - Restreindre l'usage du RAG massif, de la génération d'images ou de certains mini-jeux premium aux comptes payants.
  - Interface adaptative : Les options premium non souscrites restent visibles mais sont "grisées" avec des boutons d'up-sell directs.

### 14.6 : Enrichissement RAG par Profils de Recherche (APIs Externes)
- [ ] **Recherche Web Temps Réel (Perplexity API)** : Intégration optionnelle pour enrichir le RAG avec des données d'actualité, permettant de générer des cours sur des sujets récents ou en constante évolution.
- [ ] **Ingestion de Vidéos (YouTube API)** : Capacité à extraire et vectoriser les transcriptions de vidéos YouTube pour transformer instantanément une vidéo pertinente en module de cours et évaluations.
- [ ] **Profil SEO & Tendances (Google Keyword Planner, Search Console, Trends)** : Utilisation des données de recherche pour orienter la création de l'architecture du cours (Syllabus) et optimiser la génération des Landing Pages afin de répondre aux vraies requêtes des utilisateurs.
- [ ] **Profil Académique & Scientifique (Scite.ai, Google Scholar)** : Connexion aux banques d'articles scientifiques pour garantir un contenu "Evidence-Based", sourcé et avec un taux de confiance maximal (réduction drastique des hallucinations pour les sujets critiques/médicaux).
- [ ] **Toggle UI "Sources Actives"** : Interface permettant au créateur de cocher/décocher les sources de recherche à utiliser pour générer son cours (ex: "Mes PDF" + "YouTube" + "Recherche Académique").

### 14.7 : Moteur de Génération Documentaire (Intégration Typst)
- [ ] **Génération Automatisée de PDFs Professionnels** : Intégration de Typst pour générer des documents premium directement à partir des données de la base de connaissances / RAG et des progressions utilisateurs.
- [ ] **Templates Non Modifiables par l'Apprenant** : Création de modèles (gérés par l'admin via la plateforme web de Typst, puis importés/connectés dans l'app) qui assurent un rendu parfait, débloqués via des fonctionnalités de forfaits supérieurs.
- [ ] **Cas d'Usages Pédagogiques & Profiling (Premium)** :
  - **Ebooks & Manuels** : Support de cours complet généré à la volée.
  - **Workbooks Adaptatifs (Remédiation)** : Cahiers d'exercices PDF personnalisés selon les faiblesses d'un apprenant (basé sur le moteur SRS).
  - **Bilans de Compétences & Profiling (Lead Gen)** : Génération de bilans professionnels suite à des pré-tests / questionnaires.
  - **CVs & Plans d'Orientation Scolaire** : Documents synthétisant les acquis, destinés aux étudiants ou à des recrutements.
  - **Export de Notes Privées** : L'apprenant pourra exporter l'ensemble du module de "Prise de notes" (à développer) dans une fiche de synthèse esthétique.
- [ ] **Architecture de la Brique (JSON vers Typst)** : 
  - Flux cible : IA + RAG -> Structuration en JSON -> Moteur de template (Variables injectées) -> Compilation Typst -> Fichier PDF téléchargeable.
  - Rétrocompatibilité avec les nouveautés Typst 0.15 (améliorations typographiques, structuration, support HTML si applicable pour des aperçus rapides).




