# Architecture du Site Vitrine Multi-Tenant (Astro)

## 1. Structure de Dossiers Proposée

Pour une architecture claire, séparée du CMS React, nous vous recommandons de placer le projet Astro dans un dossier séparé (ex: `marketing-site/` ou via un monorepo type Turborepo/Nx).

```text
marketing-site/
├── public/                 # Assets statiques globaux
├── src/
│   ├── components/
│   │   ├── astro/          # Composants purement Astro (Header, Footer, SEO)
│   │   └── react/          # Composants React injectés en Islands (Teaser, Games)
│   ├── layouts/
│   │   └── TenantLayout.astro # Layout dynamique qui applique le thème du tenant
│   ├── lib/
│   │   ├── firebase.ts     # Initialisation Firebase Admin pour SSR
│   │   ├── tenantApi.ts    # Logique pour récupérer la config du tenant (couleurs, textes)
│   │   └── utils.ts        # Utilitaires divers
│   ├── pages/
│   │   ├── index.astro     # Landing page de la plateforme B2B principale
│   │   └── [tenant]/       # Routage SSR basé sur le sous-domaine/paramètre
│   │       ├── index.astro # Landing page dynamique du client Whitelabel
│   │       └── lesson/
│   │           └── [id].astro # Pages de leçons publiques pour le SEO
│   ├── styles/
│   │   └── global.css      # Entrée Tailwind CSS
│   └── env.d.ts
├── astro.config.mjs        # Config Astro (React, Tailwind, Node SSR adapter)
├── tailwind.config.mjs     # Config Tailwind (partagée ou synchronisée avec React)
├── package.json
└── tsconfig.json
```

## 2. Configuration d'Astro, React et Tailwind CSS

### Installation des dépendances
Dans le dossier du projet Astro, installez les intégrations nécessaires :
```bash
npx astro add react tailwind node
```
*Note: L'adaptateur `node` (ou `vercel`, `cloudflare`) est nécessaire pour le rendu SSR, indispensable pour un site multi-tenant basé sur les requêtes.*

### Configuration `astro.config.mjs`
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  // Active l'intégration React et Tailwind
  integrations: [react(), tailwind()],
  // Active le mode SSR (Server-Side Rendering) pour router dynamiquement selon le domaine
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })
});
```

### Partage des Composants React
Dans un environnement monorepo (ex: npm workspaces), le projet Astro peut importer directement les composants React du projet principal :
```typescript
// Dans un fichier Astro
import { InteractiveTeaser } from 'app-react/src/components/InteractiveTeaser';
import { GameCard } from 'app-react/src/components/GameCard';
```

## 3. Marche à suivre technique pour la Première Page (Landing Page Whitelabel)

### Étape 1 : Récupération de la configuration (SSR)
Astro doit déterminer quel client est demandé via l'URL (ex: `tenant1.notreplateforme.com` ou via un paramètre de route `/[tenant]/`). 
Dans `src/pages/[tenant]/index.astro` :

```astro
---
// Code serveur exécuté à chaque requête (SSR)
import TenantLayout from '../../../layouts/TenantLayout.astro';
import { getTenantConfig } from '../../../lib/tenantApi';
import { InteractiveTeaser } from 'shared-react-app/components/InteractiveTeaser';

const { tenant } = Astro.params;
// Mocker la récupération depuis Firebase/votre API
const tenantConfig = await getTenantConfig(tenant);

if (!tenantConfig) {
  return Astro.redirect('/404');
}
---

<TenantLayout config={tenantConfig}>
  <main class="flex flex-col items-center justify-center min-h-screen">
    <!-- Header dynamique avec les textes du CMS -->
    <h1 class="text-4xl font-bold" style={`color: ${tenantConfig.theme.primary}`}>
      {tenantConfig.marketing.heroTitle}
    </h1>
    <p class="mt-4 text-lg">
      {tenantConfig.marketing.heroSubtitle}
    </p>

    <!-- Injection d'un composant React en Island -->
    <div class="mt-12 w-full max-w-3xl">
      <InteractiveTeaser 
        client:visible 
        theme={tenantConfig.theme}
        gameData={tenantConfig.featuredGame} 
      />
    </div>
  </main>
</TenantLayout>
```

### Étape 2 : Le Layout Dynamique (TenantLayout.astro)
Ce layout va appliquer les couleurs du thème (gérées par votre `useTheme` dans React) sous forme de variables CSS globales, pour que Tailwind puisse les utiliser.

```astro
---
const { config } = Astro.props;
---
<html lang="fr">
  <head>
    <title>{config.marketing.siteTitle}</title>
    <!-- Injection des variables CSS générées depuis la config du CMS -->
    <style define:vars={{
      primaryColor: config.theme.primary,
      backgroundColor: config.theme.background,
      fontFamily: config.theme.fontFamily
    }}>
      :root {
        --theme-primary: var(--primaryColor);
        --theme-bg: var(--backgroundColor);
        --theme-font: var(--fontFamily);
      }
      body {
        background-color: var(--theme-bg);
        font-family: var(--theme-font), sans-serif;
      }
    </style>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Étape 3 : Mockups UI (Device Frames)
Pour les vues "purement visuelles" (ex: Progression, Timeline), vous pouvez créer un composant Astro ou React `DeviceFrame` :

```astro
---
// Composant DeviceFrame.astro
---
<div class="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px]">
  <div class="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
  <div class="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
  <div class="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
  <div class="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
  <div class="rounded-[2rem] overflow-hidden w-[272px] h-[572px] bg-white">
    <!-- Le composant React visuel injecté ici. client:idle pour le charger sans bloquer le rendu initial -->
    <slot />
  </div>
</div>
```

Utilisation :
```astro
import DeviceFrame from '../components/astro/DeviceFrame.astro';
import { GameProgress } from 'shared-react-app/components/GameProgress';

<DeviceFrame>
  <GameProgress client:idle progressionData={demoData} />
</DeviceFrame>
```

## Résumé de l'Approche
1. **CMS Headless (React)** : Vos admins Whitelabel configurent leurs couleurs et textes. La configuration est sauvegardée dans Firestore.
2. **SSR Astro** : À chaque visite, Astro lit l'URL (ou le paramètre), interroge Firestore pour la configuration correspondante, et génère le HTML statique avec les bonnes couleurs (SEO-friendly).
3. **Astro Islands (`client:visible` / `client:idle`)** : Les composants interactifs React (`InteractiveTeaser`, UI complexes) sont hydratés côté client intelligemment, minimisant le Javascript au chargement initial.
