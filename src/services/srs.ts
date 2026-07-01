/**
* MOTEUR SRS — Mots & Blocs
*
* Fonctions PURES — zéro import React, zéro import JSON, zéro effet de bord.
* Dépendance : ts-fsrs (npm install ts-fsrs)
*
* Algorithme : FSRS v5 via ts-fsrs
* Supérieur à SM-2 sur la précision de rappel — c'est l'algo qu'Anki utilise par défaut depuis 2023.
*/
import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card,
  type ReviewLog,
} from 'ts-fsrs';

export { Rating };

// ─── Instance FSRS ──────────────────────────────────────────────
const f = fsrs();

// ─── Types ──────────────────────────────────────────────────────
export interface SrsCard {
  itemId: string;
  module: string;
  // Champs ts-fsrs sérialisés pour Firestore
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number; // 0=New 1=Learning 2=Review 3=Relearning
  last_review?: string;
  learning_steps: number;
  // Champs personnalisés pour détecter les blocages conceptuels (R1)
  consecutive_lapses?: number;
  is_blocked?: boolean;
}

export interface ScheduleResult {
  updatedCard: SrsCard;
  reviewLog: ReviewLog;
}

// ─── Conversion Card ↔ SrsCard ───────────────────────────────────
function toFsrsCard(srsCard: SrsCard): Card {
  return {
    due: new Date(srsCard.due),
    stability: srsCard.stability,
    difficulty: srsCard.difficulty,
    elapsed_days: srsCard.elapsed_days,
    scheduled_days: srsCard.scheduled_days,
    reps: srsCard.reps,
    lapses: srsCard.lapses,
    state: srsCard.state as any,
    last_review: srsCard.last_review ? new Date(srsCard.last_review) : undefined,
    learning_steps: srsCard.learning_steps ?? 0,
  };
}

function fromFsrsCard(card: Card, itemId: string, module: string): SrsCard {
  return {
    itemId,
    module,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    last_review: card.last_review?.toISOString(),
    learning_steps: card.learning_steps ?? 0,
  };
}

// ─── Créer une nouvelle carte ────────────────────────────────────
export function createSrsCard(itemId: string, module: string): SrsCard {
  const card = createEmptyCard(new Date());
  return fromFsrsCard(card, itemId, module);
}

// ─── Calculer le prochain intervalle après une réponse ───────────
export function scheduleNext(
  card: SrsCard,
  rating: Rating,
  now: Date = new Date()
): ScheduleResult {
  const fsrsCard = toFsrsCard(card);
  const scheduling = f.repeat(fsrsCard, now);
  const result = scheduling[rating];
  
  const updatedCard = fromFsrsCard(result.card, card.itemId, card.module);
  
  // R1: Détecteur de blocage conceptuel
  // Si on échoue (Rating.Again = 1), on incrémente. Sinon on remet à zéro.
  const isFail = rating === Rating.Again;
  const currentLapses = card.consecutive_lapses || 0;
  
  updatedCard.consecutive_lapses = isFail ? currentLapses + 1 : 0;
  // Seuil de blocage fixé à 3 échecs consécutifs
  updatedCard.is_blocked = updatedCard.consecutive_lapses >= 3;
  
  return {
    updatedCard,
    reviewLog: result.log,
  };
}

// ─── Sélection de la session quotidienne ─────────────────────────
export interface SessionOptions {
  maxItems?: number;       // défaut : 15
  maxNouveaux?: number;    // défaut : 5
}

export function selectDailySession(
  allCards: SrsCard[],
  allItemIds: string[], // tous les IDs disponibles pour ce niveau
  opts: SessionOptions = {}
): string[] {
  const maxItems = opts.maxItems ?? 15;
  const maxNouveaux = opts.maxNouveaux ?? 5;
  const now = new Date();

  // 1. Items dus (révisions)
  const dus = allCards
    .filter((c) => new Date(c.due) <= now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    .slice(0, maxItems - maxNouveaux)
    .map((c) => c.itemId);

  // 2. Nouveaux items (jamais vus)
  const vuIds = new Set(allCards.map((c) => c.itemId));
  const nouveaux = allItemIds
    .filter((id) => !vuIds.has(id))
    .slice(0, maxNouveaux);

  // 3. Fusion + shuffle + cap
  const session = [...dus, ...nouveaux];
  return shuffle(session).slice(0, maxItems);
}

// ─── Vérifier si un item est dû ──────────────────────────────────
export function isDue(card: SrsCard, now: Date = new Date()): boolean {
  return new Date(card.due) <= now;
}

// ─── Utilitaire shuffle ─────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── XP par rating ───────────────────────────────────────────────
// Basé sur getPointsConfig().routineBase = 2
export function xpForRating(rating: Rating, routineBase: number = 2): number {
  switch (rating) {
    case Rating.Again: return 0;               // Pas d'XP — à revoir
    case Rating.Hard:  return routineBase * 0.5;
    case Rating.Good:  return routineBase;
    case Rating.Easy:  return routineBase * 1.5;
    default:           return routineBase;
  }
}
