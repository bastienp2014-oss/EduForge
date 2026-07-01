import badgesData from './badges.json';

export type BadgeCondition = {
  statId: string;
  threshold: number;
};

export type Badge = {
  id: string;
  titre: string;
  description: string;
  icon: string;
  conditions: BadgeCondition[];
  categorie: 'arcade' | 'apprentissage' | 'social' | 'special';
};

export const BADGES: Badge[] = badgesData as Badge[];
