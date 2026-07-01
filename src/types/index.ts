export type Difficulty = 'debutant' | 'intermediaire' | 'avance';

// Exemple de tags pour classifier le contenu
export type ContentTag = 
  | 'vocabulaire' 
  | 'grammaire' 
  | 'expression' 
  | 'faux-ami'
  | 'mot-court' // Sans espaces, idéal pour Pendu
  | 'phrase'    // Contient des espaces
  | 'qcm-ready' // Possède des options définies
  | 'audio-disponible';

// --- Architecture Pédagogique (Contenu) ---

export interface Course {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  imageUrl?: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  // Les niveaux/modules sont gérés via ProgressionConfig dans ce cours
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'theorie' | 'jeu' | 'video' | 'quiz';
  mechanic?: MechanicId;
  contentIds: string[]; // Références aux ContentItem
  order: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
}

// --- Architecture de Monétisation (Produits) ---

export type ProductType = 'course' | 'bundle' | 'level';

export interface Product {
  id: string;
  tenantId: string;
  type: ProductType;
  referenceId: string; // L'ID du cours, du bundle, ou du niveau spécifique
  title: string;
  description: string;
  price: number;
  currency: string;
  billingType: 'one-time' | 'subscription';
  status: 'active' | 'inactive';
  imageUrl?: string;
}

export interface Bundle {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  courseIds: string[]; // Les cours inclus dans ce bundle
  imageUrl?: string;
}

// --- Architecture des Droits d'Accès (Entitlements) ---

export interface Entitlement {
  id: string;
  userId: string;
  tenantId: string;
  productId: string;
  courseIds: string[]; // Les cours auxquels l'utilisateur a accès via cet achat
  levelIds?: string[]; // Si l'accès est restreint à certains niveaux/modules
  grantedAt: string;
  expiresAt?: string; // Pour les abonnements
}

// --- Architecture RBAC & Multi-Comptes ---

export type TenantRole = 'owner' | 'admin' | 'creator' | 'employee' | 'support';

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  email: string;
  addedAt: string;
  status: 'active' | 'invited' | 'suspended';
  customPermissions?: string[]; // Permissions granulaires optionnelles
}

// --- Architecture de Partage de Revenus (Creators) ---

export interface RevenueShareAgreement {
  id: string;
  tenantId: string;
  creatorId: string; // Le userId du formateur/créateur
  productId: string; // Le produit concerné (Course, Bundle, etc.)
  shareType: 'percentage' | 'fixed';
  shareValue: number; // ex: 30 pour 30%, ou 10 pour 10€
  createdAt: string;
  active: boolean;
}

// --- Progression Indépendante ---

export interface UserCourseProgression {
  courseId: string;
  xp: number;
  completedLessons: Record<string, boolean>; // lessonId -> true
  unlockedLevels: string[];
  lastAccessedAt: string;
  startedAt: string;
}

// --- Modèle d'Item existant ---
export interface ContentItem {
  id: string;
  module: string; // Ex: 'mots', 'anglicismes', 'quiz'
  niveau: number; // Le niveau requis pour débloquer (hiérarchique)
  tags: ContentTag[]; // Catégorisation (descriptif)
  
  // Le contenu brut, qui sera interprété différemment selon la mécanique
  payload: {
    question?: string;       // Utilisé par le QCM, Flashcard...
    answer: string;          // La bonne réponse (mot à deviner pour le Pendu, réponse pour Flashcard)
    options?: string[];      // Les distracteurs pour le QCM
    exemple?: string;        // Phrase contextuelle
    translation?: string;    // Traduction optionnelle
    hint?: string;           // Indice
    audioUrl?: string;       // Si un tag 'audio-disponible' est présent
  };
}

import { MechanicDataLot1, MechanicDataLot2, MechanicDataLot3, MechanicDataLot4, MechanicDataLot5 } from './mechanics';

export interface BaseGameProps {
  items: ContentItem[];
  data?: MechanicDataLot1 | MechanicDataLot2 | MechanicDataLot3 | MechanicDataLot4 | MechanicDataLot5;
  onBack: () => void;
  onComplete: (score: number) => void;
  onResponse: (itemId: string, rating: number) => void;
  isEmbedded?: boolean;
}

// Les ID des mécaniques de jeu disponibles
export type MechanicId = 
  | 'flashcard'
  | 'quiz'
  | 'swipe'
  | 'pendu'
  | 'typing';

// Interface définissant les contraintes d'une mécanique
export interface MechanicConstraints {
  id: MechanicId;
  name: string;
  // Fonction qui détermine si un ContentItem peut être joué avec cette mécanique
  isCompatible: (item: ContentItem) => boolean;
}

// Exemple de définition de la matrice de compatibilité
export const COMPATIBILITY_MATRIX: Record<MechanicId, MechanicConstraints> = {
  'flashcard': {
    id: 'flashcard',
    name: 'Flashcard',
    // Les flashcards acceptent quasiment tout, tant qu'il y a une réponse
    isCompatible: (item) => !!item.payload.answer,
  },
  'quiz': {
    id: 'quiz',
    name: 'QCM',
    // Le QCM a besoin d'options ou on doit pouvoir les générer (à gérer plus tard)
    isCompatible: (item) => !!item.payload.question && !!item.payload.answer && Array.isArray(item.payload.options) && item.payload.options.length > 0,
  },
  'swipe': {
    id: 'swipe',
    name: 'Swipe Binaire',
    // Swipe a généralement besoin d'une question binaire (Vrai/Faux) ou d'associer deux termes
    isCompatible: (item) => !!item.payload.question || !!item.payload.answer,
  },
  'pendu': {
    id: 'pendu',
    name: 'Jeu du Pendu',
    // Le pendu ne marche bien qu'avec des mots seuls, pas de phrases entières
    isCompatible: (item) => (item.tags.includes('mot-court') || item.tags.includes('vocabulaire')) && !item.payload.answer.includes(' '),
  },
  'typing': {
    id: 'typing',
    name: 'Frappe au clavier',
    isCompatible: (item) => !!item.payload.answer,
  }
};
