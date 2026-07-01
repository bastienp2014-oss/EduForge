import { describe, it, expect } from 'vitest';
import { calculateRevenueSplits } from './revenue';

describe('calculateRevenueSplits', () => {
  it('calcule correctement la répartition 30/70 par défaut', () => {
    const amount = 100;
    const splits = calculateRevenueSplits(amount);

    expect(splits.platformPercentage).toBe(30);
    expect(splits.creatorPercentage).toBe(70);
    expect(splits.platformAmount).toBe(30);
    expect(splits.creatorAmount).toBe(70);
  });

  it('calcule correctement avec des montants flottants', () => {
    const amount = 49.99;
    const splits = calculateRevenueSplits(amount);

    expect(splits.platformAmount).toBeCloseTo(14.997);
    expect(splits.creatorAmount).toBeCloseTo(34.993);
  });

  it('permet de configurer un pourcentage de plateforme personnalisé', () => {
    const amount = 100;
    const splits = calculateRevenueSplits(amount, 15);

    expect(splits.platformPercentage).toBe(15);
    expect(splits.creatorPercentage).toBe(85);
    expect(splits.platformAmount).toBe(15);
    expect(splits.creatorAmount).toBe(85);
  });

  it('lève une erreur si le montant est négatif', () => {
    expect(() => calculateRevenueSplits(-50)).toThrow('montant ne peut pas être négatif');
  });

  it('lève une erreur si le pourcentage est invalide', () => {
    expect(() => calculateRevenueSplits(100, 110)).toThrow('entre 0 et 100');
    expect(() => calculateRevenueSplits(100, -5)).toThrow('entre 0 et 100');
  });
});
