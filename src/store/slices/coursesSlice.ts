import { StateCreator } from 'zustand';
import { CoursesSlice, ProgressionState } from '../progressionTypes';

export const createCoursesSlice: StateCreator<ProgressionState, [], [], CoursesSlice> = (set, get) => ({
  courseProgressions: {},
  entitlements: [],

  startCourse: (courseId) => {
    set(state => {
      if (state.courseProgressions[courseId]) return state;
      
      return {
        courseProgressions: {
          ...state.courseProgressions,
          [courseId]: {
            courseId,
            xp: 0,
            completedLessons: {},
            unlockedLevels: [],
            lastAccessedAt: new Date().toISOString(),
            startedAt: new Date().toISOString()
          }
        }
      };
    });
    get().sauvegarderVersFirebase();
  },

  completeCourseLesson: (courseId, lessonId, xpGained) => {
    set(state => {
      const courseProg = state.courseProgressions[courseId];
      if (!courseProg) return state;

      return {
        courseProgressions: {
          ...state.courseProgressions,
          [courseId]: {
            ...courseProg,
            xp: courseProg.xp + xpGained,
            completedLessons: {
              ...courseProg.completedLessons,
              [lessonId]: true
            },
            lastAccessedAt: new Date().toISOString()
          }
        }
      };
    });
    get().addXp(xpGained);
    get().sauvegarderVersFirebase();
  },

  grantEntitlement: (entitlement) => {
    set(state => ({
      entitlements: [...state.entitlements, entitlement]
    }));
    get().sauvegarderVersFirebase();
  },

  hasAccessToCourse: (courseId) => {
    const state = get();
    if (state.isAdmin || state.isPremium) return true;
    
    return state.entitlements.some(ent => 
      ent.courseIds.includes(courseId)
    );
  }
});
