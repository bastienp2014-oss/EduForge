import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

let firebaseConfigStr = "{}";
try {
  firebaseConfigStr = fs.readFileSync(path.resolve(__dirname, 'firebase-applet-config.json'), 'utf-8');
} catch (e) {
  console.warn("firebase-applet-config.json not found during build.");
}

export default defineConfig(() => {
  return {
    define: {
      '__FIREBASE_CONFIG__': firebaseConfigStr
    },
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'firebase-messaging-sw.js',
        registerType: 'autoUpdate',
        manifest: false, // We use standard public/manifest.webmanifest
        injectManifest: {
          maximumFileSizeToCacheInBytes: 4000000,
          // App shell only cache - exclude big resources
          globPatterns: ['**/*.{js,css,html,ico,svg,json}'],
          globIgnores: [
            '**/node_modules/**/*', 
            'sw.js', 
            'workbox-*.js',
            'money/*', // Exclusion temporaire des assets lourds pré-Phase 12
          ],
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'jsdom',
      // Nécessite l'émulateur Firestore — exécuté séparément via `npm run test:rules`.
      exclude: ['**/node_modules/**', 'src/store/firestoreConfigRules.test.ts'],
    },
  };
});
