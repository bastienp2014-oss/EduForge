import { describe, expect, it } from 'vitest';
import {
  ActivityNodeSchema,
  ChapterNodeSchema,
  CourseNodeSchema,
  LessonNodeSchema,
  ProgramNodeSchema,
  computeContextDigest,
  firestorePathFor,
  isDigestStale,
} from './hierarchy';

const NOW = '2026-07-08T00:00:00.000Z';

function baseCommon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'node-1',
    tenantId: 'tenant-a',
    title: 'Titre valide',
    order: 0,
    status: 'draft' as const,
    createdAt: NOW,
    updatedAt: NOW,
    contextDigest: '',
    digestVersion: 1,
    digestComputedAt: NOW,
    ...overrides,
  };
}

function validProgram(overrides: Record<string, unknown> = {}) {
  return baseCommon({ parentDigestVersion: null, ...overrides });
}

function validCourse(overrides: Record<string, unknown> = {}) {
  return baseCommon({ parentDigestVersion: 1, ...overrides });
}

function validChapter(overrides: Record<string, unknown> = {}) {
  return baseCommon({ parentDigestVersion: 1, ...overrides });
}

function validLesson(overrides: Record<string, unknown> = {}) {
  return baseCommon({ parentDigestVersion: 1, kind: 'theory' as const, ...overrides });
}

function validActivity(overrides: Record<string, unknown> = {}) {
  return baseCommon({
    parentDigestVersion: 1,
    mechanicId: '02_multiple_choice',
    contentItemIds: [],
    ...overrides,
  });
}

describe('hierarchy schemas — un nœud valide de chaque niveau est accepté', () => {
  it('program', () => {
    expect(ProgramNodeSchema.safeParse(validProgram()).success).toBe(true);
  });
  it('course', () => {
    expect(CourseNodeSchema.safeParse(validCourse()).success).toBe(true);
  });
  it('chapter', () => {
    expect(ChapterNodeSchema.safeParse(validChapter()).success).toBe(true);
  });
  it('lesson', () => {
    expect(LessonNodeSchema.safeParse(validLesson()).success).toBe(true);
  });
  it('activity', () => {
    expect(ActivityNodeSchema.safeParse(validActivity()).success).toBe(true);
  });
});

describe('hierarchy schemas — un champ inconnu est rejeté (.strict())', () => {
  it('program', () => {
    const result = ProgramNodeSchema.safeParse(validProgram({ unknownField: 'x' }));
    expect(result.success).toBe(false);
  });
  it('activity', () => {
    const result = ActivityNodeSchema.safeParse(validActivity({ unknownField: 'x' }));
    expect(result.success).toBe(false);
  });
});

describe('hierarchy schemas — un champ requis manquant est rejeté', () => {
  it('program sans title', () => {
    const data = validProgram() as Record<string, unknown>;
    delete data.title;
    expect(ProgramNodeSchema.safeParse(data).success).toBe(false);
  });
  it('activity sans mechanicId', () => {
    const data = validActivity() as Record<string, unknown>;
    delete data.mechanicId;
    expect(ActivityNodeSchema.safeParse(data).success).toBe(false);
  });
});

describe('hierarchy schemas — parentDigestVersion strictement typé par niveau', () => {
  it('program avec parentDigestVersion !== null est rejeté', () => {
    expect(ProgramNodeSchema.safeParse(validProgram({ parentDigestVersion: 1 })).success).toBe(false);
  });
  it('course avec parentDigestVersion === null est rejeté', () => {
    expect(CourseNodeSchema.safeParse(validCourse({ parentDigestVersion: null })).success).toBe(false);
  });
  it('chapter avec parentDigestVersion === null est rejeté', () => {
    expect(ChapterNodeSchema.safeParse(validChapter({ parentDigestVersion: null })).success).toBe(false);
  });
  it('lesson avec parentDigestVersion === null est rejeté', () => {
    expect(LessonNodeSchema.safeParse(validLesson({ parentDigestVersion: null })).success).toBe(false);
  });
  it('activity avec parentDigestVersion === null est rejeté', () => {
    expect(ActivityNodeSchema.safeParse(validActivity({ parentDigestVersion: null })).success).toBe(false);
  });
});

describe('computeContextDigest', () => {
  const chain = [
    { level: 'program' as const, title: 'Programme A', summary: 'Résumé A' },
    { level: 'course' as const, title: 'Cours B' },
  ];

  it('est déterministe : deux appels avec la même chaîne produisent une sortie identique', () => {
    expect(computeContextDigest(chain)).toBe(computeContextDigest(chain));
  });

  it("l'ordre de la chaîne change la sortie", () => {
    const reversed = [...chain].reverse();
    expect(computeContextDigest(chain)).not.toBe(computeContextDigest(reversed));
  });

  it('tronque à 4000 caractères', () => {
    const longChain = Array.from({ length: 200 }, (_, i) => ({
      level: 'chapter' as const,
      title: `Chapitre ${i} — ${'x'.repeat(50)}`,
    }));
    const digest = computeContextDigest(longChain);
    expect(digest.length).toBe(4000);
  });

  it('une chaîne vide (nœud program, aucun ancêtre) produit une chaîne vide', () => {
    expect(computeContextDigest([])).toBe('');
  });
});

describe('isDigestStale', () => {
  it('true quand parentDigestVersion !== parent.digestVersion', () => {
    expect(isDigestStale({ parentDigestVersion: 1 }, { digestVersion: 2 })).toBe(true);
  });
  it('false quand parentDigestVersion === parent.digestVersion', () => {
    expect(isDigestStale({ parentDigestVersion: 2 }, { digestVersion: 2 })).toBe(false);
  });
  it("false pour un program (parent === null)", () => {
    expect(isDigestStale({ parentDigestVersion: null }, null)).toBe(false);
  });
});

describe('activity.mechanicId — contrainte de forme uniquement', () => {
  it("'02_multiple_choice' est accepté", () => {
    expect(ActivityNodeSchema.safeParse(validActivity({ mechanicId: '02_multiple_choice' })).success).toBe(true);
  });
  it("'MultipleChoice' est rejeté (majuscules)", () => {
    expect(ActivityNodeSchema.safeParse(validActivity({ mechanicId: 'MultipleChoice' })).success).toBe(false);
  });
  it("'' est rejeté", () => {
    expect(ActivityNodeSchema.safeParse(validActivity({ mechanicId: '' })).success).toBe(false);
  });
});

describe('firestorePathFor', () => {
  it('construit le chemin complet pour le niveau activity', () => {
    expect(
      firestorePathFor('activity', {
        tenantId: 't1',
        programId: 'p1',
        courseId: 'c1',
        chapterId: 'ch1',
        lessonId: 'l1',
        activityId: 'a1',
      })
    ).toBe('tenants/t1/programs/p1/courses/c1/chapters/ch1/lessons/l1/activities/a1');
  });

  it('lève une erreur si un id requis pour le niveau manque', () => {
    expect(() => firestorePathFor('course', { tenantId: 't1' })).toThrow();
  });
});
