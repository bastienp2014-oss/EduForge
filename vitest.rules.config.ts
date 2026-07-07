import { defineConfig } from 'vitest/config';

// Config dédiée au test des firestore.rules — nécessite l'émulateur Firestore
// (voir `npm run test:rules`). Séparée de vite.config.ts pour ne jamais faire
// dépendre `npm test` d'un émulateur en cours d'exécution.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/store/firestoreConfigRules.test.ts'],
  },
});
