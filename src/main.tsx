import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './i18n';
import './index.css';
import { analytics } from './services/analytics';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Ignorer les erreurs réseau bénignes ou les erreurs de navigation non-critiques
    ignoreErrors: [
      'Network Error',
      'Failed to fetch',
      'Load failed',
      /timeout/i,
      'ResizeObserver loop limit exceeded'
    ],
    dataCollection: {
      // Pour des raisons de confidentialité
      // userInfo: false,
      // httpBodies: []
    }
  });
}

// Active le ConsoleProvider en développement.
// Pour brancher PostHog en production : remplace ConsoleProvider par PostHogProvider ici.
// Voir src/services/analytics.ts pour les instructions.
if (import.meta.env.DEV) {
  import('./services/analytics').then(({ analytics }) => {
    class ConsoleProvider {
      track(event: string, props?: Record<string, unknown>) {
        console.log(`[Analytics] ${event}`, props ?? {});
      }
      identify(userId: string, traits?: Record<string, unknown>) {
        console.log(`[Analytics] identify: ${userId}`, traits ?? {});
      }
      reset() {
        console.log('[Analytics] reset');
      }
    }
    analytics.setProvider(new ConsoleProvider() as any);
  });
}

import { ErrorBoundary } from './ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
