import { describe, it, expect } from 'vitest';
import { getTileColors, getTileTextColor } from './tileColors';

describe('tileColors utils', () => {
  describe('getTileColors', () => {
    it('returns an array of 8 hex colors', () => {
      const colors = getTileColors('#C75B39');
      expect(colors).toHaveLength(8);
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('handles invalid hex gracefully', () => {
      const colors = getTileColors('invalid');
      expect(colors).toHaveLength(8);
    });
  });

  describe('getTileTextColor', () => {
    it('returns ink color for light backgrounds', () => {
      const textColor = getTileTextColor('#ffffff', '#1a1a24');
      expect(textColor).toBe('#1a1a24');
    });

    it('returns white for dark backgrounds', () => {
      const textColor = getTileTextColor('#000000', '#1a1a24');
      expect(textColor).toBe('#ffffff');
    });
  });
});
