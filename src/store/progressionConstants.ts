import { PointsConfig, ProgressionConfig } from './progressionTypes';

export const DEFAULT_POINTS: PointsConfig = {
  quizCorrect: 1.25,
  swipeCorrect: 0.50,
  routineBase: 2,
  blocsCorrect: 0.25,
  sortCorrect: 1,
  hacheCorrect: 5,
  tuCorrect: 5,
  contractionsCorrect: 5,
  tutoiementCorrect: 5,
  game2048Correct: 2.25
};

export const DEFAULT_CONFIG: ProgressionConfig = {
  niveaux: [
    { id: 1, nom: "Le Nouveau-Venu", seuilScore: 0, points: { ...DEFAULT_POINTS } },
    { id: 2, nom: "Le Mitonné", seuilScore: 100, points: { ...DEFAULT_POINTS } },
    { id: 3, nom: "Le Magasineur", seuilScore: 250, points: { ...DEFAULT_POINTS } },
    { id: 4, nom: "Le Jaseur", seuilScore: 500, points: { ...DEFAULT_POINTS } },
    { id: 5, nom: "Le Collègue", seuilScore: 1000, points: { ...DEFAULT_POINTS } },
    { id: 6, nom: "Le Gérant d'Estrade", seuilScore: 2000, points: { ...DEFAULT_POINTS } },
    { id: 7, nom: "L'Habitué", seuilScore: 3500, points: { ...DEFAULT_POINTS } },
    { id: 8, nom: "L'Ambassadeur", seuilScore: 5000, points: { ...DEFAULT_POINTS } }
  ]
};

// Capture UTM au premier chargement
export const captureUTM = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_campaign: params.get('utm_campaign'),
    utm_medium: params.get('utm_medium'),
    referrer: document.referrer || null,
  };
};
