export const conceptTechnique = `
L'architecture de Mots & Blocs Québec est pensée pour être robuste, ultra-rapide pis facile à maintenir.

- **Frontend (Interface)** : Bâti avec React pis Vite. On utilise Tailwind CSS pour un "styling" fluide pis responsive sur toutes les grosseurs d'écran. Parfait pour le mobile (PWA).
- **Backend (Serveur)** : Firebase est en charge. Firestore pour la base de données (sauvegarde de la progression, mots débloqués), pis Firebase Auth pour l'authentification des joueurs sans niaisage.
- **Monétisation** : RevenueCat sera intégré pour s'occuper des abonnements pis des achats in-app (modèle freemium). Beaucoup plus simple que de coder la logique des stores à la mitaine. // TODO: réactiver quand livré — RevenueCat (Ph.8)
- **Architecture d'état** : On gère le "state" avec Zustand pour que ça reste léger. Chaque mode de jeu (Blocs, Mots, 2048, Tri) a ses propres "hooks" pour isoler la logique.
- **Pédagogie** : Un algorithme de répétition espacée "Spaced Repetition" sera mis en place. Les mots difficiles pour les immigrants (surtout le vocabulaire TEF/TCF) reviendront plus souvent. // TODO: réactiver quand livré — SRS (Ph.6)
`;

export const arborescence = `app/
├── src/
│   ├── assets/            # Fichiers statiques (images, sons, polices)
│   ├── components/        # Composants UI partagés (Boutons, Cartes, Modales)
│   ├── config/            # Configurations (Firebase, RevenueCat)
│   ├── features/          # Les 4 modes de jeu séparés
│   │   ├── blocs/         # Logique et UI pour Blocs Québec
│   │   ├── mots/          # Logique et UI pour Mots du Québec
│   │   ├── 2048/          # Logique et UI pour 2048 Québec
│   │   └── tri/           # Logique et UI pour Le Trieur de Rue
│   ├── hooks/             # Custom hooks (ex: useProgression, useAuth)
│   ├── locales/           # Fichiers pour l'internationalisation (i18n)
│   ├── services/          # Appels API, logique Firebase
│   ├── store/             # Gestion globale de l'état (Zustand)
│   ├── types/             # Types TypeScript (Interfaces, Enums)
│   ├── utils/             # Fonctions utilitaires (formatage, maths)
│   ├── App.tsx            # Routeur principal
│   └── main.tsx           # Point d'entrée React
├── package.json           # Dépendances du projet
└── vite.config.ts         # Configuration Vite`;

export const marketingStore = {
  titreCourt: "Mots & Blocs Québec",
  titreLong: "Mots & Blocs Québec : Apprends le franco d'icitte !",
  descriptionCourte: "Le jeu le plus l'fun pour maîtriser le vrai vocabulaire québécois et se préparer pour le TEF/TCF Canada.",
  descriptionLongue: [
    "T'as le goût d'apprendre le vrai français parlé au Québec ? Mots & Blocs Québec, c'est l'application parfaite pour les nouveaux arrivants pis tous ceux qui veulent se préparer aux examens d'immigration (TEF/TCF) sans s'ennuyer une seconde !",
    "",
    "Découvre 4 modes de jeu capotants :",
    "• Blocs Québec : Place tes blocs et complète des lignes pour débloquer de nouveaux mots et répondre à des quiz éclairs !",
    "• Mots du Québec : Relie les lettres pour former des expressions typiques d'icitte.",
    "• 2048 Québec : Fusionne les tuiles pour découvrir du vocabulaire de plus en plus avancé.",
    "• Le Trieur de Rue : Classe les objets et les mots dans les bonnes catégories (parfait pour la compréhension orale et écrite).",
    "",
    "Fonctionnalités :",
    "• Des centaines de mots et d'expressions (de \"tuque\" à \"chum\" en passant par \"dépanneur\").",
    "• Prononciation audio authentique.",
    "• Suivi de progression pis algorithme intelligent pour booster ta mémoire.",
    "• Sera jouable hors-ligne (pas besoin de data dans le métro). // TODO: réactiver quand livré — Offline (Ph.5+12)",
    "",
    "Télécharge Mots & Blocs Québec astheure pis jase comme un vrai Québécois !"
  ],
  motsCles: "Québec, français québécois, TEF, TCF, apprendre le français, jeux de mots, immigration Canada, vocabulaire, 2048, blocs, éducation"
};
