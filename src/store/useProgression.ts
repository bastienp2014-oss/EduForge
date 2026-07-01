import { create } from 'zustand';
import { ProgressionState } from './progressionTypes';
import { createEconomySlice } from './slices/economySlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createInventorySlice } from './slices/inventorySlice';
import { createStatsSlice } from './slices/statsSlice';
import { createCoursesSlice } from './slices/coursesSlice';
import { createSyncSlice } from './slices/syncSlice';

export const useProgression = create<ProgressionState>((...a) => ({
  ...createEconomySlice(...a),
  ...createSettingsSlice(...a),
  ...createInventorySlice(...a),
  ...createStatsSlice(...a),
  ...createCoursesSlice(...a),
  ...createSyncSlice(...a)
}));

// Re-export types from progressionTypes so existing imports don't break
export * from './progressionTypes';

