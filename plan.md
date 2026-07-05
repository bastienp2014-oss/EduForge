# Plan d'Action — Deep Generation OS (v2, reconstruit)

> Ce plan remplace l'ancien `plan.md`. Il repose exclusivement sur l'état **vérifié** du code (audit 2026-07-02) et sur la vision Deep Generation (hiérarchie 7 niveaux, blueprints, multi-copilots, HITL, RAG sourcé).
> Règles : chaque item a un **critère d'acceptation testable** ; aucun item n'est coché sans preuve dans le code ; les invariants servis sont indiqués entre crochets — [HIER] hiérarchie, [BP] blueprint, [ISO] isolation de contexte, [HITL] validation humaine, [COPILOT] multi-copilots.

---

## État vérifié (acquis, avec preuves)

- ✅ **SPA React 19 / Vite / TS / Tailwind / React Router 7** avec lazy loading (`src/App.tsx`) et ErrorBoundary + Sentry.
- ✅ **Zustand en slices** : `useProgression` découpé (economy, inventory, settings, stats, courses, sync) ; sélecteurs stricts.
- ✅ **25 mécaniques typées** (`src/mechanics/*`, `src/types/mechanics.ts`, registre `index.ts`) + matrice de compatibilité (`COMPATIBILITY_MATRIX`) + mapper (`mechanicDataMapper.ts`).
- ✅ **Moteur SRS FSRS v5** pur (`src/services/srs.ts`) avec détection de blocage conceptuel (R1) et Dashboard mémoriel (R2).
- ✅ **Tuteur IA v0** connecté aux échecs récents + disclaimer de limites (R12) (`AITutorChat.tsx`).
- ✅ **Validation pédagogique R3/R11** dans `DataGeneratorModal` (apprenant naïf, profondeur cognitive, redondances, étape de revue).
- ✅ **Backend Express** : auth Firebase (custom claims), rate limiting, Sentry, endpoints revenue avec transactions atomiques, parsing PDF/DOCX.
- ✅ **RAG v0 fonctionnel** (ingest → embed `text-embedding-004` → cosinus → génération contrainte par `responseSchema`) — mais **volatile (RAM) et non isolé** (voir Phase 2).
- ✅ **Multi-tenant Firestore** : rules deny-by-default, isolation `tenantId`, RBAC (owner/admin/creator/…), invitation de membres via API.
- ✅ **Hub Créateur** (cours/bundles, statut draft/published), modèles Product/Entitlement/RevenueShareAgreement (types + UI ; persistance des accords **manquante**).
- ✅ **Site vitrine Astro SSR multi-tenant** : layouts, JSON-LD, sitemaps par tenant, teaser interactif.
- ✅ **Notes privées apprenant** (`useNotes`, `PrivateNotesWidget`, rules `notes/{userId}`).
- ✅ Vitest opérationnel (3 suites : revenue, tileColors, useTenant).

## Dette et écarts connus (entrée des phases ci-dessous)

- RAG en mémoire, index `"global"` partagé inter-tenants, sans ACL ni citations.
- Sorties IA appliquées directement (scaffold) — pas d'entité Blueprint.
- Hiérarchie vision absente ; contenu généré stocké dans le doc utilisateur.
- Sélecteur de mécaniques limité à 5 ids (2 invalides) ; `LessonGameScreen` ne dispatche que 4 mécaniques.
- Superadmin par email hardcodé ; `/api/economy/update` non validé ; BYOK en localStorage ; App Check quasi inactif ; endpoints debug ouverts.
- Config tenant (jeux, flags, devise) en localStorage ; flags non liés aux plans, non vérifiés serveur.
- Restes verticaux "Québec" dans le noyau (écrans, prompts, i18n, clés `quebec-*`).
- Pas de CI, pas d'E2E, pas d'évals IA/RAG ; fichiers morts (`fix.js`, `scripts/directus-setup.cjs`, handoff design dans le repo).

---

## Phase 0 — Sécurité & hygiène (Semaines 1-2) — BLOQUANT

- [ ] **Superadmin sans email hardcodé** (partiellement restauré, reste AdminScreen.tsx) : source = custom claim uniquement ; provisioning par script d'admin ; retrait des 3 occurrences (`server.ts`, `firestore.rules`, `syncSlice.ts`). *AC : grep de l'email = 0 résultat ; tests rules verts. Validé le 2026-07-02.*
- [ ] **Endpoints debug** (partiellement restauré, reste debug-sentry) : suppression de `/api/debug-sentry` en prod ; `/api/debug/error` authentifié + taille bornée + rotation. *AC : appel non authentifié → 401.*
- [x] **Économie côté serveur** : `/api/economy/update` n'accepte plus de montants libres ; XP/piasses dérivés d'événements de jeu validés (type d'activité → barème serveur). *AC : payload arbitraire → 400 ; barème testé. Validé le 2026-07-02.*
- [x] **App Check partout** : `requireAppCheck` sur tous les `/api/gemini/*` et `/api/admin/*` ; front migré sur `secureFetch`. *AC : requête sans token App Check → 401 (après 1 semaine en mode monitor). Validé le 2026-07-02.*
- [ ] **Clés IA côté serveur** (partiellement restauré, x-api-key encore dans src/) : BYOK stocké chiffré dans `tenants/{id}/secrets` ; suppression du header `x-api-key` et du fallback silencieux ; quota Gemini par tenant. *AC : clé absente du localStorage ; dépassement quota → 429. Validé le 2026-07-02.*
- [ ] **Garde-fous RAG v0** : limite de taille d'ingestion + quota tenant + restriction aux rôles admin/creator du tenant. *AC : ingestion 10 Mo → 413.*
- [ ] **Lecture publique Firestore réduite** : `tenants/{id}` et `configuration/**` réservés aux authentifiés ; document `tenants/{id}/public/site` dédié pour Astro. *AC : lecture anonyme des configs → deny ; site Astro fonctionnel.*
- [ ] **CI minimale** : GitHub Actions `tsc + eslint + vitest` sur PR. *AC : pipeline requis pour merge.*
- [x] **Purge fichiers morts** : `design_handoff_theme_system/` archivé hors repo ; suppression `fix.js`, `scripts/directus-setup.cjs`, `scripts/out.txt`, `tsconfig.tsbuildinfo`, script `db:push`.

## Phase 1 — Fondations : hiérarchie & Blueprint Engine (Semaines 3-7) [HIER][BP][HITL]

- [ ] **Modèle hiérarchique 7 niveaux** sous `tenants/{id}` : `programs → courses → chapters → lessons → activities → questions`, chaque nœud portant `contextDigest` hérité. *AC : schémas Zod partagés (`packages/shared/hierarchy.ts`) + rules + tests emulator.*
- [ ] **Migration** : `ProgressionConfig` (niveaux/chapitres/leçons) → hiérarchie sous un Programme "default" ; `customContentItems` déplacés du doc utilisateur vers `tenants/{id}/contentItems` rattachés aux leçons. *AC : script idempotent, dual-read 2 semaines, zéro perte de progression (test E2E).*
- [ ] **Blueprint Engine** : collection `tenants/{id}/blueprints`, machine à états `draft → in_review → approved/rejected → published`, versionnage des éditions humaines, publication transactionnelle vers la hiérarchie, audit (`generations` : modèle, promptVersion, tokens, coût, citations). *AC : impossible d'écrire un nœud publié sans blueprint approuvé (test d'intégration).*
- [ ] **File de revue (Directeur éditorial)** : UI listant les blueprints, diff/édition inline, approbation unitaire et "tout approuver". *AC : parcours E2E scaffold → revue → publication.*
- [ ] **Refonte des générateurs existants en émetteurs de blueprints** : `generate-scaffold-rag`, `generate-lesson-rag`, `generate-items-rag`, `generate-scenario`, `generate-marketing`. Les `responseSchema` sont définis **côté serveur** (le client n'envoie plus de schéma). *AC : `AdminIA` n'applique plus rien directement ; grep `updateProgressionConfig` hors publication = 0.*
- [ ] **Config tenant en BDD** : `useGames`, `useAppConfig` (nav, devise, tags, flags) migrés vers `tenants/{id}/configuration` ; `persist` réservé aux préférences UI. *AC : deux navigateurs voient la même config.*

## Phase 2 — RAG durable, isolé, sourcé (Semaines 6-10) [ISO]

- [ ] **Vector store persistant** derrière l'interface `VectorStore` (implémentation 1 : Firestore KNN ; bascule Qdrant possible). Clé composite `tenantId:courseId`, ACL vérifiée à chaque appel, purge par cours. *AC : test bloquant "une requête tenant A ne remonte jamais un chunk tenant B".*
- [ ] **Ingestion de production** : chunking sémantique (paragraphes/phrases), embeddings par lots, déduplication par hash, job asynchrone avec statut consultable. *AC : ingestion 200 pages < 3 min, reprise sur échec.*
- [ ] **Citations bout-en-bout** : chaque retrieval retourne `{sourceId, span, score}` ; les blueprints stockent les citations ; l'UI de revue les affiche. *AC : une leçon générée sans citation ≥ seuil est marquée "non sourcée".*
- [ ] **Sources externes (SourceProvider)** : Perplexity (recherche temps réel) d'abord ; puis Google Scholar/Scite (evidence-based) ; puis YouTube (transcriptions). Toggle "Sources actives" par génération. *AC : génération avec Perplexity actif produit des citations URL ; désactivé → aucune requête externe (test).*
- [ ] **Évals RAG** : golden set par vertical ; groundedness ≥ 0,9 ; recall@k ≥ 0,8 ; test négatif "hors corpus → refus d'inventer". *AC : suite bloquante en pré-release.*

## Phase 3 — Multi-copilots & mécaniques dynamiques (Semaines 10-16) [COPILOT]

- [ ] **Orchestrateur + prompts versionnés** (`packages/prompts`, id@version) ; abstraction `LlmClient` (modèles par copilot en config, retry, coûts).
- [ ] **Brand Copilot (macro)** : onboarding conversationnel admin (thématique, persona cible, direction artistique) → blueprints `brand_identity` (nom, slogan, palette, design tokens) et `marketing_site`. *AC : un tenant vierge est configurable de bout en bout par la conversation, sous revue humaine.*
- [ ] **Course Copilot (méso)** : pipeline Knowledge→Course granulaire — syllabus (blueprint `course_syllabus`), puis génération chapitre par chapitre et leçon par leçon avec `contextDigest` hérité, RAG du cours + sources externes. *AC : contexte strictement limité au cours (test d'isolation) ; suggestions de mécaniques incluses dans le syllabus.*
- [ ] **Registre des 25 mécaniques** (`MECHANIC_REGISTRY`) : ids canoniques + legacy, formes de contenu requises, cibles cognitives, contraintes, schémas de payload. Sélection en 2 étapes : filtre déterministe (`eligibleMechanics`) puis classement LLM ; override créateur (et apprenant si autorisé). *AC : `suggest-mechanic` couvre les 25 ids valides ; plus aucun id fantôme.*
- [ ] **Dispatch unifié** : `LessonGameScreen` et `DynamicGameScreen` partagent la même factory 25 mécaniques. *AC : chaque mécanique jouable depuis une leçon (test matrice).*
- [ ] **Micro Tutor (micro)** : génération d'activités par leçon (blueprints `activity`/`question_set` conformes aux schémas de mécaniques) + tuteur socratique v1 (stratégie question→indice→explication, mémoire de session persistée, contexte = leçon + profil SRS). *AC : le tuteur cite la leçon ; scénario de test "ne donne pas la réponse au 1er tour".*
- [ ] **R4 — 26e mécanique "Génération"** (réponse ouverte évaluée) branchée sur le Micro Tutor.

## Phase 4 — Monétisation, flags serveur, marketing IA (Semaines 16-22)

- [ ] **Feature flags par plan** dans `tenants/{id}` + middleware `planGate` sur l'API + UI up-sell (options grisées). *AC : flag désactivé → 403 serveur, pas seulement UI.*
- [ ] **Quotas de génération par tier** (nb blueprints/mois, taille RAG, images) avec compteurs serveur et alertes budget.
- [ ] **Paiements réels (Stripe)** : checkout, webhooks → entitlements écrits serveur ; `hasAccessToCourse` vérifié côté serveur pour le contenu premium. *AC : achat sandbox → accès ; remboursement → révocation.*
- [ ] **Revenue share réel** : persistance des `RevenueShareAgreement`, split dynamique dans `process-transaction` (fin du 30 % hardcodé), relevés créateurs. *AC : accord 20 % → ledger correspondant.*
- [ ] **Marketing & SEO générés** : Brand Copilot produit les pages Astro (blueprints `seo_page` : hero, bénéfices, FAQ, meta, JSON-LD) et les landing pages programmatiques niche/ville, publiées après revue. *AC : nouvelle page indexable créée sans toucher au code.*
- [ ] **Neutralisation du noyau** : extraction de la verticale Québec (écrans `ville/depanneur/tutoiement/...`, prompts "québécois", i18n survie, clés `quebec-*`) vers un tenant seed de démonstration. *AC : un tenant "anatomie médicale" ne contient aucun artefact québécois.*

## Phase 5 — Extensions premium (Semaines 22+)

- [ ] **Typst — moteur documentaire** : service de rendu isolé, flux Blueprint JSON → template Typst → PDF (ebooks, workbooks adaptatifs SRS, bilans, export de notes) ; accès par tier. *AC : PDF généré depuis un cours publié en < 30 s.*
- [ ] **Analytics actionnables (Smart Actions)** : recommandations admin issues des données de progression + LLM, sous forme de blueprints d'action. 
- [ ] **Transcript académique & certificats** ; **pré/post-tests adaptatifs** ; **skill graph** (liaisons tags↔compétences + visualisation).
- [ ] **Leaderboards par cohortes** ; couche sociale.

---

## Gouvernance du plan

- Toute case cochée doit référencer un commit + le test d'acceptation.
- Revue mensuelle : ce fichier est régénéré à partir de l'état du code, jamais l'inverse.
- KPI de pilotage : % de blueprints publiés sans édition humaine ; groundedness moyenne ; coût IA par cours publié ; délai brief → cours publié.
