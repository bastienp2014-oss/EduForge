import { StateCreator } from 'zustand';
import { StatsSlice, ProgressionState } from '../progressionTypes';
import { BADGES } from '../../data/badges';
import { analytics } from '../../services/analytics';

export const createStatsSlice: StateCreator<ProgressionState, [], [], StatsSlice> = (set, get) => ({
  streakCount: 0,
  lastActiveDay: null,
  longestStreak: 0,
  stats: {},
  badgesDeclenches: {},
  leconsCompletes: {},
  scenariosCompletes: {},

  enregistrerActiviteDuJour: () => {
    const today = new Date().toLocaleDateString('en-CA');
    const state = get();

    if (state.lastActiveDay === today) return;

    let newStreak = 1;

    if (state.lastActiveDay) {
      const last = new Date(state.lastActiveDay);
      const now = new Date(today);
      const diffDays = Math.round(
        (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak = state.streakCount + 1;
      } else {
        newStreak = 1;
      }
    }

    const newLongest = Math.max(newStreak, state.longestStreak);

    set({
      streakCount: newStreak,
      lastActiveDay: today,
      longestStreak: newLongest,
    });
    
    if (newStreak > (state.stats['streak_max'] || 0)) {
       get().incrementStat('streak_max', newStreak - (state.stats['streak_max'] || 0));
    }

    analytics.streakIncremented(newStreak);
    analytics.dailySessionStarted(newStreak);

    get().sauvegarderVersFirebase();
  },

  incrementStat: (statId, amount = 1) => {
    set(state => {
      const current = state.stats[statId] || 0;
      return { stats: { ...state.stats, [statId]: current + amount } };
    });
    get().verifierBadges();
    get().sauvegarderVersFirebase();
  },

  debloquerBadge: (badgeId) => {
    set(state => {
      if (state.badgesDeclenches[badgeId]) return state;
      return {
        badgesDeclenches: { ...state.badgesDeclenches, [badgeId]: new Date().toISOString() }
      };
    });
    get().sauvegarderVersFirebase();
  },

  verifierBadges: () => {
    const { stats, badgesDeclenches, debloquerBadge } = get();
    BADGES.forEach(badge => {
      if (badgesDeclenches[badge.id]) return;
      
      const unlocked = badge.conditions.every(cond => {
        const value = stats[cond.statId] || 0;
        return value >= cond.threshold;
      });

      if (unlocked) {
        debloquerBadge(badge.id);
      }
    });
  },

  completerLecon: (leconId) => {
    set(state => ({
      leconsCompletes: {
        ...state.leconsCompletes,
        [leconId]: true
      }
    }));
    get().sauvegarderVersFirebase();
  },

  completerScenario: (id, outcome) => {
    set(state => ({
      scenariosCompletes: {
        ...state.scenariosCompletes,
        [id]: { outcome, date: new Date().toISOString() }
      }
    }));
    get().sauvegarderVersFirebase();
  }
});
