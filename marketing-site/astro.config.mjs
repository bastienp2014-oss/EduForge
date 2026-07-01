import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://astro.build/config
export default defineConfig({
  // Active l'intégration React et Tailwind
  integrations: [react(), tailwind()],
  // Active le mode SSR (Server-Side Rendering) pour router dynamiquement selon le tenant
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  vite: {
    resolve: {
      alias: {
        // Permet d'importer les composants de l'app React principale
        '@shared': path.resolve(__dirname, '../src')
      }
    }
  }
});
