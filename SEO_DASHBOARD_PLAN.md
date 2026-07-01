# Architecture du Tableau de Bord SEO Multi-Tenant

En tant qu'architecte logiciel, voici ma recommandation détaillée pour intégrer un moteur et un tableau de bord SEO complet dans votre solution SaaS marque blanche.

## 1. Où intégrer ce tableau de bord ? (React vs Astro)

**Réponse courte : Dans l'application React (CMS Admin).**

- **Astro (`marketing-site`)** est conçu pour le **front-end public** : la génération des pages vitrines, le rendu côté serveur (SSR) rapide pour Googlebot, et la présentation des jeux/leçons aux utilisateurs finaux sans compte administrateur. Ces pages doivent être indexables et ultrarapides.
- **L'application React (`src/features/admin/...`)** est votre **back-office**. Un tableau de bord SEO est un outil d'administration, lourd en données, protégé par authentification, contenant des graphiques (ex: Recharts) et des filtres dynamiques. Il n'a aucun besoin d'être indexé par Google. C'est donc naturellement dans le CMS React actuel qu'il doit vivre (ex: `src/features/admin/AdminSEO.tsx`).

---

## 2. Architecture & Fonctionnalités (KPIs)

Le tableau de bord doit avoir un niveau de permission pour afficher différentes données.

### A. Niveau Super-Admin (Vous)
*Objectif : Vue d'ensemble (Macro), monitoring de la plateforme, ET pilotage de votre propre site vitrine.*
* **Votre propre Site Vitrine (Le "Tenant 0")** : Accès exact aux mêmes fonctionnalités granulaires que vos clients (Clics, impressions, requêtes, top pages) mais dédiées à votre site marketing principal (blogs, pages de vente, etc.). Vous êtes votre propre premier client.
* **Trafic Agrégé (Réseau)** : Clics et impressions totaux sur tous les tenants combinés (pour voir la force de frappe de votre réseau).
* **Classement des Tenants** : "Top 10 des clients générant le plus de trafic" (Utile pour détecter des cas d'usage à succès et faire de l'upsell).
* **Santé Globale du Réseau** : Pourcentage global de pages 404, état des sitemaps globaux.
* **Monitoring API** : Consommation des quotas de vos API.

### B. Niveau Tenant / Client Marque Blanche
*Objectif : Preuve de valeur. Le client doit voir que son investissement chez vous génère du trafic.*
* **Vue d'ensemble SEO** : Graphique d'évolution des Clics, Impressions, CTR (Taux de clic) et Position Moyenne (issues de Google Search Console).
* **Trafic Organique vs Reste** : Pourcentage de visiteurs venant de Google vs Accès directs (issues de Google Analytics).
* **Top Pages** : Les 5 landing pages ou "Jeux" qui attirent le plus de visiteurs organiques.
* **Top Requêtes (Mots-clés)** : Les termes exacts tapés dans Google par les utilisateurs pour trouver ce client.
* **Santé basique** : Nombre de pages indexées vs non indexées.

### C. Niveau Granulaire (Par Page / Jeu)
*Objectif : Optimisation tactique d'un contenu.*
* **Trafic spécifique à la page** : Impressions et clics ciblés.
* **Éditeur de Métadonnées (Aperçu SERP)** : Édition du Title, Meta Description avec un aperçu visuel (façon Snippet Google).
* **Analyseur de mots-clés (IA)** : Bouton "Suggérer des optimisations avec l'IA" qui analyse le texte du jeu et propose de meilleurs Titles/Descriptions.

---

## 3. Stratégie d'intégration (Sources de données)

Pour un vrai tableau de bord SEO, **Google Search Console (GSC) API** est la source la plus importante, suivie de **Google Analytics 4 (GA4) API**.

### Comparatif des approches

| Outil | Ce qu'il apporte | Avantages | Inconvénients (en Multi-tenant) |
| :--- | :--- | :--- | :--- |
| **Google Search Console API** | Les vrais Mots-clés, Impressions Google, Positionnement, CTR. La vérité SEO absolue. | Gratuit, données 100% réelles de Google. | Si les clients ont leur propre domaine (ex: `client.com`), il faut un flux OAuth pour qu'ils connectent leur compte GSC à votre app. |
| **Google Analytics 4 API** | Comportement post-clic : Taux d'engagement, temps passé sur la page, conversions (ventes). | Gratuit. Indispensable pour mesurer l'usage. | Complexe à requêter. Ne donne pas les mots-clés de recherche (not provided). |
| **Ahrefs / Semrush API** | Analyse concurrentielle, Backlinks (liens entrants), Volume de recherche global des mots-clés. | Zéro configuration requise côté client (données tierces). | Extrêmement cher (payé au crédit d'API). Compliqué à rentabiliser pour tous les locataires. |

**La stratégie recommandée pour votre MVP SaaS :**
1. Utilisez l'**API Google Search Console**.
2. **Pour les sous-domaines (`client1.plateformedu.com`)** : Vous pouvez vérifier la propriété "Domaine" racine (`plateformedu.com`) dans votre GSC, et interroger l'API en filtrant par le sous-domaine du client. (Zéro effort pour le client).
3. **Pour les domaines personnalisés (`www.siteclient.com`)** : Implémentez un bouton "Connecter mon compte Google Search Console" en utilisant OAuth (que nous pouvons gérer avec la skill `workspace_integration` pour l'authentification Google).

---

## 4. Architecture des Données (Stockage)

**NE PAS interroger les API Google (GSC/GA4) en temps réel à chaque fois qu'un client ouvre son dashboard.** 
1. C'est très lent (plusieurs secondes).
2. Vous exploserez les quotas de l'API Google.

**Solution : Agrégation et mise en cache nocturne (ETL).**

Dans votre base de données (Firestore ou PostgreSQL), créez une structure de données pour stocker des agrégations temporelles.

**Structure Firestore suggérée :**
Une collection `seo_metrics_daily` (Données statistiques historiques, optimisée pour tracer des graphiques rapides)
```json
{
  "tenantId": "tenant_123",
  "date": "2024-03-25", // Format YYYY-MM-DD
  "source": "GSC", // ou GA4
  "metrics": {
    "clicks": 145,
    "impressions": 3400,
    "ctr": 0.042,
    "position": 12.4
  },
  "topKeywords": [
    { "term": "cours anglais paris", "clicks": 50, "impressions": 300 },
    { "term": "jeu vocabulaire anglais", "clicks": 20, "impressions": 150 }
  ]
}
```

**Le flux de travail (Cron Job) :**
1. Chaque nuit à 2h du matin, un Cron Job (Firebase Cloud Function ou un service Node backend) se déclenche.
2. Il interroge l'API Google Search Console pour récupérer les données de la veille pour *chaque* tenant.
3. Il sauvegarde le résultat dans la collection `seo_metrics_daily` dans Firebase.
4. Quand le client se connecte à son dashboard React, il requête directement Firebase (`where tenantId == X`). L'affichage des graphiques est quasi-instantané et ne consomme pas d'API Google.
