/**
 * ANALYTICS — Mots & Blocs
 *
 * ─────────────────────────────────────────────────────────────────
 * Couche d'analytics agnostique du fournisseur.
 *
 * POUR BRANCHER POSTHOG (ou tout autre outil) :
 *   1. Installe le SDK : npm install posthog-js
 *   2. Crée une classe PostHogProvider implements AnalyticsProvider
 *      qui délègue track/identify/reset à posthog.capture / posthog.identify / posthog.reset
 *   3. Dans main.tsx, remplace :
 *      analytics.setProvider(new ConsoleProvider())
 *      par                          :
 *      analytics.setProvider(new PostHogProvider(POSTHOG_KEY))
 *   → UN SEUL point de modification. Zéro changement ailleurs dans le code.
 * ─────────────────────────────────────────────────────────────────
 */

import type { ObjectifPrincipal } from '../store/useProgression';

// ─── Types des événements ────────────────────────────────────────

export type AnalyticsEvent =
  | 'signup'
  | 'onboarding_step_viewed'
  | 'aha_moment_reached'
  | 'is_francophone_set'
  | 'segment_selected'
  | 'onboarding_completed'
  | 'screen_viewed'
  | 'module_started'
  | 'module_completed'
  | 'answer_recorded'
  | 'piasses_earned'
  | 'xp_earned'
  | 'store_purchase'
  | 'daily_session_started'
  | 'streak_incremented'
  | 'paywall_viewed'
  | 'paywall_dismissed'
  | 'subscription_started';

// Bucket temporel pour dateArrivee — évite de stocker une donnée précise
export type ArrivalBucket = '0-3_mois' | '3-6_mois' | '6+_mois' | 'futur' | 'inconnu';

export function getArrivalBucket(dateArrivee: string | null): ArrivalBucket {
  if (!dateArrivee) return 'inconnu';
  const arrival = new Date(dateArrivee);
  const now = new Date();
  const diffDays = (now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) return 'futur';
  if (diffDays <= 90) return '0-3_mois';
  if (diffDays <= 180) return '3-6_mois';
  return '6+_mois';
}

// ─── Interface du fournisseur ────────────────────────────────────

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, props?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

// ─── Provider noop (défaut — silencieux) ────────────────────────

class NoopProvider implements AnalyticsProvider {
  track(): void {}
  identify(): void {}
  reset(): void {}
}

// ─── Provider console (développement) ───────────────────────────

class ConsoleProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
    console.log(`[Analytics] ${event}`, props ?? {});
  }
  identify(userId: string, traits?: Record<string, unknown>): void {
    console.log(`[Analytics] identify: ${userId}`, traits ?? {});
  }
  reset(): void {
    console.log('[Analytics] reset');
  }
}

// ─── Singleton analytics ─────────────────────────────────────────

class Analytics {
  private provider: AnalyticsProvider = new NoopProvider();

  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
  }

  // ── Authentification ──────────────────────────────────────────────

  signup(method: 'google' | 'anonymous'): void {
    this.provider.track('signup', { method });
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.provider.identify(userId, traits);
  }

  reset(): void {
    this.provider.reset();
  }

  // ── Onboarding ────────────────────────────────────────────────────

  onboardingStepViewed(step: string): void {
    this.provider.track('onboarding_step_viewed', { step });
  }

  ahaMomentReached(): void {
    this.provider.track('aha_moment_reached');
  }

  isFrancophoSet(value: boolean): void {
    this.provider.track('is_francophone_set', { value });
  }

  segmentSelected(objectif: ObjectifPrincipal): void {
    this.provider.track('segment_selected', { objectif });
  }

  onboardingCompleted(params: {
    is_francophone: boolean;
    objectif: ObjectifPrincipal;
    arrival_bucket: ArrivalBucket;
  }): void {
    this.provider.track('onboarding_completed', params);
  }

  // ── Navigation ────────────────────────────────────────────────────

  screenViewed(screen: string): void {
    this.provider.track('screen_viewed', { screen });
  }

  // ── Modules ───────────────────────────────────────────────────────

  moduleStarted(module: string): void {
    this.provider.track('module_started', { module });
  }

  moduleCompleted(module: string, score: number): void {
    this.provider.track('module_completed', { module, score });
  }

  answerRecorded(params: {
    module: string;
    correct: boolean;
    item_id?: string;
  }): void {
    this.provider.track('answer_recorded', params);
  }

  // ── Économie ──────────────────────────────────────────────────────

  piassesEarned(amount: number, source: string): void {
    this.provider.track('piasses_earned', { amount, source });
  }

  // Préparé pour Phase 3 (découplage XP/Piasses) — appelé depuis le store
  xpEarned(amount: number, source: string): void {
    this.provider.track('xp_earned', { amount, source });
  }

  storePurchase(item_id: string, cost: number): void {
    this.provider.track('store_purchase', { item_id, cost });
  }

  // ── Rétention ─────────────────────────────────────────────────────

  dailySessionStarted(streak_count: number): void {
    this.provider.track('daily_session_started', { streak_count });
  }

  streakIncremented(length: number): void {
    this.provider.track('streak_incremented', { length });
  }

  // ── Monétisation ──────────────────────────────────────────────────

  paywallViewed(trigger: string): void {
    this.provider.track('paywall_viewed', { trigger });
  }

  paywallDismissed(trigger: string): void {
    this.provider.track('paywall_dismissed', { trigger });
  }

  subscriptionStarted(plan: 'basic' | 'premium'): void {
    this.provider.track('subscription_started', { plan });
  }
}

export const analytics = new Analytics();
