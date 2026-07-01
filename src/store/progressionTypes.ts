import { ContentItem, UserCourseProgression, Entitlement } from '../types';

export type ObjectifPrincipal = 'survie' | 'travail' | 'social' | 'etudes' | 'famille' | null;

export interface PointsConfig {
  quizCorrect: number;
  swipeCorrect: number;
  routineBase: number;
  blocsCorrect: number;
  sortCorrect: number;
  hacheCorrect: number;
  tuCorrect: number;
  contractionsCorrect: number;
  tutoiementCorrect: number;
  game2048Correct: number;
}

export interface LeconConfig {
  id: string;
  nom: string;
  type: 'theorie' | 'jeu';
  mechanic?: "flashcard" | "quiz" | "swipe" | "pendu" | "drag_drop" | "fill_in_the_blank" | "memory";
  tags: string[];
  contentSource?: 'lesson' | 'chapter' | 'level';
  theorieContent?: string;
}

export interface ChapitreConfig {
  id: string;
  nom: string;
  description?: string;
  lecons: LeconConfig[];
}

export interface NiveauConfig {
  id: number;
  nom: string;
  seuilScore: number;
  points: PointsConfig;
  badgeImage?: string;
  chapitres?: ChapitreConfig[];
}

export interface ProgressionConfig {
  niveaux: NiveauConfig[];
}

export interface EconomySlice {
  piasses: number;
  xp: number;
  addPiasses: (montant: number) => Promise<void>;
  addXp: (montant: number) => Promise<void>;
  depenserPiasses: (cout: number) => Promise<boolean>;
  getNiveau: () => number;
  getPointsConfig: () => PointsConfig;
}

export interface SettingsSlice {
  audioSpeed: number | null;
  paysOrigine: string | null;
  localisationActuelle: 'quebec' | 'canada' | 'pas_arrive' | null;
  acquisitionSource: {
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    referrer: string | null;
  } | null;
  surnom: string;
  isPremium: boolean;
  subscriptionPlan: 'free' | 'basic' | 'premium';
  isAdmin: boolean;
  dateArrivee: string | null;
  hasCompletedOnboarding: boolean;
  objectifPrincipal: ObjectifPrincipal;
  isFrancophone: boolean;
  progressionConfig: ProgressionConfig;
  uiPositions: Record<string, { x: number, y: number, scale?: number }>;
  customContentItems: ContentItem[];

  setAudioSpeed: (speed: number) => void;
  setPaysOrigine: (pays: string) => void;
  setLocalisationActuelle: (loc: 'quebec' | 'canada' | 'pas_arrive') => void;
  setAcquisitionSource: (source: {
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    referrer: string | null;
  }) => void;
  setSurnom: (nouveau: string) => void;
  setPremium: (status: boolean) => void;
  setSubscriptionPlan: (plan: 'free' | 'basic' | 'premium') => void;
  setDateArrivee: (date: string) => void;
  completeOnboarding: () => void;
  setObjectifPrincipal: (obj: ObjectifPrincipal) => void;
  setIsFrancophone: (status: boolean) => void;
  updateProgressionConfig: (newConfig: ProgressionConfig) => Promise<void>;
  setUIPosition: (elementId: string, pos: { x: number, y: number, scale?: number }) => void;
  addCustomContentItems: (items: ContentItem[]) => void;
  getFeatureFlags: () => Record<string, boolean>;
}

export interface InventorySlice {
  motsDebloques: string[];
  inventaire: Record<string, number>;
  
  debloquerMot: (motId: string) => void;
  acheterObjet: (objetId: string, cout: number) => Promise<boolean>;
  echangerObjetContreMot: (objetId: string, motId: string) => Promise<boolean>;
}

export interface StatsSlice {
  streakCount: number;
  lastActiveDay: string | null;
  longestStreak: number;
  stats: Record<string, number>;
  badgesDeclenches: Record<string, string>;
  leconsCompletes: Record<string, boolean>;
  scenariosCompletes: Record<string, { outcome: string; date: string }>;
  
  enregistrerActiviteDuJour: () => void;
  incrementStat: (statId: string, amount?: number) => void;
  debloquerBadge: (badgeId: string) => void;
  verifierBadges: () => void;
  completerLecon: (leconId: string) => void;
  completerScenario: (id: string, outcome: string) => void;
}

export interface CoursesSlice {
  courseProgressions: Record<string, UserCourseProgression>;
  entitlements: Entitlement[];
  
  startCourse: (courseId: string) => void;
  completeCourseLesson: (courseId: string, lessonId: string, xpGained: number) => void;
  grantEntitlement: (entitlement: Entitlement) => void;
  hasAccessToCourse: (courseId: string) => boolean;
}

export interface SyncSlice {
  synchroniserDepuisFirebase: () => Promise<void>;
  sauvegarderVersFirebase: () => Promise<void>;
}

export type ProgressionState = EconomySlice & SettingsSlice & InventorySlice & StatsSlice & CoursesSlice & SyncSlice;
