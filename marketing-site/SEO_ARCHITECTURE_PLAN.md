# Plan d'Architecture SEO & Référencement Automatisé (Projet Astro)

L'optimisation du référencement (SEO) de l'application marque blanche doit bénéficier des capacités natives d'Astro tout en intégrant une dimension automatisée par l'IA, idéale pour générer du contenu sémantique, cibler des mots clés géographiques, ou créer des pages dynamiques sans effort manuel de la part de vos locataires (tenants).

## 1. Intégration Native Astro SEO

Nous utiliserons `astro-seo` pour gérer les métadonnées de base (OpenGraph, Title, Description, Keywords). 

### Layout de base (`TenantLayout.astro`)
Nous avons déjà ajouté `astro-seo` qui permet d'injecter facilement les balises pour chaque client à partir de la configuration récupérée dans Firebase/Directus :

```astro
<SEO
  title={siteTitle}
  description={seoDescription}
  openGraph={{
    basic: { title: siteTitle, type: "website", image: ogImage }
  }}
/>
```

## 2. Intégration d'un Moteur "SEO / GEO" Automatisé (IA)

Des solutions comme `open-seo` ou `seomachine` visent à générer programmatiquement des pages ciblées sur des niches et des localisations (ex: "Apprendre l'anglais à Paris", "Apprendre l'espagnol pour les affaires à Lyon").

### Architecture Hybride (Astro SSR + Edge Generation)

Pour implémenter ce genre de moteur dans Astro, sans saturer la base de données :

**A. Génération Programmatique des URL (SSR Route)**
Créez une route "Attrape-tout" (Catch-all) pour le contenu généré par l'IA :
`/marketing-site/src/pages/[tenant]/[...slug].astro`

**B. Logique "On-Demand" (Just-in-Time Generation)**
Lorsqu'un visiteur (ou Googlebot) demande `/tenant1/cours-anglais-paris` :
1. Astro vérifie si le contenu existe en cache ou dans Firebase.
2. S'il n'existe pas, Astro (via une Serverless Function Vercel/Node) appelle le Moteur IA (via l'API Gemini ou OpenAI) pour générer l'article basé sur la requête (Langue = Anglais, Ville = Paris, Style = Éducatif).
3. Le résultat est retourné à l'utilisateur, mis en forme avec `TenantLayout`, et mis en cache (Redis ou Firestore) pour les prochaines requêtes.

### C. Sitemaps Dynamiques
Pour forcer l'indexation de ces URL générées, il faut utiliser `@astrojs/sitemap`.
Cependant, Astro génère le sitemap au *build time*. Pour un environnement SSR multi-tenant, vous devrez créer une route dynamique d'API `sitemap.xml.ts` :

```typescript
// /marketing-site/src/pages/[tenant]/sitemap.xml.ts
export async function GET({ params, request }) {
  const { tenant } = params;
  const urls = await getGeneratedSEOUrlsForTenant(tenant); // Récupère les villes/niches depuis la DB
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
      <url>
        <loc>${new URL(url, request.url).href}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </url>
    `).join('')}
  </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

## 3. Options et Alternatives

- **Open-SEO / SEO Machine** : Ce sont d'excellents exemples pour générer des pages structurées par ville ou secteur, mais vous pouvez très bien reproduire cette logique en interne avec des prompts Gemini via les Google AI Studio API.
- **Astro DB / Astro Studio** : Pour mettre en cache les pages générées par l'IA sans setup lourd.
- **Micro-Services** : Séparer l'application de rendu (Astro) de l'application de génération (un script Cron qui peuple Firebase avec des articles générés par l'IA la nuit). C'est souvent plus sûr pour éviter les temps de chargement infinis (Timeouts) lorsque Googlebot crawle une page qui n'existe pas encore.

### Recommandation 

1. Commencez par le **SEO classique** via le Headless CMS (champs Title/Description gérés par le superadmin).
2. Créez un **générateur asynchrone** (Cron Job) qui utilise Gemini pour rédiger des Landing Pages par mot-clé et les stocker dans Firebase (collection `seo_pages`).
3. Astro se contentera de **lire** Firebase (SSR) plutôt que de générer le contenu en temps réel. C'est plus sûr et beaucoup plus rapide pour le SEO.
