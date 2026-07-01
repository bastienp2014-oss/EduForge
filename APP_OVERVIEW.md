# Présentation Globale de la Plateforme

## Ce qu'elle fait
Cette application est une plateforme LMS (Learning Management System) SaaS multi-locataires (multi-tenant) B2B2C. Elle permet de créer, diffuser, et monétiser des formations interactives, ludifiées et adaptatives. Elle gère la progression des apprenants via un moteur de répétition espacée (SRS), intègre des mécaniques de jeux variées (25 mécaniques allant du QCM aux flashcards, en passant par des jeux de type 2048 ou des dialogues interactifs), et propose un système complet de gestion financière (répartition des revenus/royalties entre la plateforme et les créateurs).

## À qui elle s'adresse
- **Organismes de formation et entreprises (B2B)** : Ceux qui ont besoin de portails dédiés (white-label, multi-tenant) pour former leurs collaborateurs ou clients avec des outils de reporting, d'administration (gestion des rôles, cohortes) et de personnalisation.
- **Créateurs de contenu / Infopreneurs (B2C/B2B)** : Les experts métiers souhaitant monétiser leur savoir à travers des parcours gamifiés (économie virtuelle, badges, niveaux).
- **Apprenants finaux** : Utilisateurs cherchant une expérience d'apprentissage engageante, sur mobile ou bureau, avec un feedback immédiat, de la ludification, et un suivi granulaire de leurs compétences.

## Structure technique
- **Frontend** : Application Single-Page (SPA) développée en **React (Vite) avec TypeScript**. L'interface est stylisée avec **Tailwind CSS**.
- **Gestion d'état** : **Zustand** pour les états globaux complexes (Progression, Économie, Tenant, Auth, SRS), découpés en slices modulaires.
- **Backend** : Un serveur **Node.js / Express** intégrant des API sécurisées pour les opérations sensibles (royalties, webhooks, transactions), servant également le build frontend en production.
- **Base de données & Authentification** : **Firebase (Firestore & Auth)**. Les données sont structurées pour supporter le multi-tenant. La sécurité est renforcée par Firebase App Check (reCAPTCHA v3) et des règles Firestore (Rules).
- **Tests & Qualité** : **Vitest** pour les tests unitaires métiers, **ESLint** pour le linting, et **Sentry** pour le monitoring des erreurs.
- **Architecture Multi-Tenant** : Le code est pensé pour cloisonner les données par espace (`tenantId`), avec une personnalisation de thème par locataire.
- **Marketing** : Un site statique vitrine séparé géré avec **Astro** (`/marketing-site`).

## Philosophie pédagogique
La plateforme s'écarte du modèle traditionnel "entrepôt de cours vidéo". Elle privilégie l'**apprentissage actif et le micro-learning** :
- **Apprentissage adaptatif (SRS)** : Un algorithme de répétition espacée optimise la mémorisation à long terme en adaptant la fréquence de révision des concepts.
- **Gamification intrinsèque** : La progression est récompensée par une économie virtuelle (pièces, items, portefeuilles), des niveaux et des badges, favorisant la rétention.
- **Interactivité** : Une bibliothèque de 25 mécaniques interactives force l'apprenant à agir, tester et appliquer, plutôt que de lire ou regarder passivement.

## Unité fondamentale actuelle
L'unité fondamentale est la **"Leçon" / "Mécanique"**. Le système repose sur des "Parcours" constitués de leçons, chaque leçon instanciant une mécanique interactive spécifique (ex: `01_FlashcardSRS`, `18_DialogueTree`). La réussite à ces blocs alimente directement le profil de l'apprenant (inventaire, monnaie, progression SRS).

## Forces et limites perçues
**Forces :**
- **Architecture évolutive et multi-tenant** nativement intégrée, idéale pour les offres en marque blanche.
- **Richesse des mécaniques interactives** (25+ modèles pré-codés) offrant une expérience très différenciée par rapport aux LMS classiques.
- **Robustesse métier** : Système financier de redevances poussé, monitoring (Sentry), et sécurisation (App Check).
- **Moteur SRS intégré**, une vraie valeur ajoutée pédagogique souvent absente des LMS grand public.

**Limites :**
- **Complexité pour un simple créateur** : L'interface et les concepts (SRS, Économie, Multi-tenant) peuvent intimider un solopreneur cherchant juste à héberger 3 vidéos.
- **Absence actuelle d'outils auteur IA poussés** : La création des leçons reste manuelle, nécessitant de remplir des configurations spécifiques.
- **Reporting institutionnel / académique** : Il manque encore un système de "transcript" consolidé et officiel, bien que prévu dans le plan de développement (Phase 12).
- **Couche sociale** : L'apprentissage social (forums, cohortes, chat en direct) est encore en devenir.

## Vision à long terme
Devenir un **"Système d'Exploitation de l'Apprentissage Actif" (Knowledge Graph Learning OS)**.
La plateforme vise à intégrer de plus en plus d'Intelligence Artificielle de bout en bout :
- **Création IA (AI Copilot)** : Convertir des documents ou vidéos existantes en modules interactifs et quiz.
- **Adaptive Learning explicable** : Tracer précisément le niveau de compétence (Skill Graph) de chaque apprenant et ajuster le parcours en conséquence.
- **Outil d'Opérations B2B complet** : Renforcer l'analytique actionnable (recommander des actions aux admins) et l'interopérabilité (SCORM/LTI, bien que la priorité soit le format natif) pour s'imposer sur le marché de la formation professionnelle formelle et certifiante.
