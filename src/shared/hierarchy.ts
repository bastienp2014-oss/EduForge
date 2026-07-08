import { z } from 'zod';

// Cinq niveaux de hiérarchie de contenu, imbriqués en sous-collections Firestore
// réelles (tenants/{id}/programs/{id}/courses/{id}/chapters/{id}/lessons/{id}/activities/{id}).
// `activities` est le nœud terminal — le niveau `questions` est différé (voir plan.md Phase 1+).
//
// Ce type n'est JAMAIS un champ stocké sur un document : `isValidHierarchyNode` (firestore.rules)
// ne vérifie aucun champ `level`, et aucun des schémas ci-dessous n'en déclare un. Le niveau est
// déductible du chemin de collection Firestore lui-même — le stocker en plus créerait une source
// de vérité redondante que rien ne validerait côté rules.
export const HIERARCHY_LEVELS = ['program', 'course', 'chapter', 'lesson', 'activity'] as const;
export type HierarchyLevel = typeof HIERARCHY_LEVELS[number];

// Champs communs à tous les niveaux. `parentDigestVersion` est délibérément exclu d'ici : son
// type diffère par niveau (null strict pour `program`, number pour les autres) — voir chaque
// schéma ci-dessous.
const commonFields = {
  id: z.string().min(1),
  tenantId: z.string().min(1),
  title: z.string().min(1).max(200),
  order: z.number().int().min(0),
  status: z.enum(['draft', 'published']),
  createdAt: z.string(),
  updatedAt: z.string(),

  contextDigest: z.string().max(4000),
  digestVersion: z.number().int().min(1),
  digestComputedAt: z.string(),
};

export const ProgramNodeSchema = z.object({
  ...commonFields,
  parentDigestVersion: z.null(),
  summary: z.string().max(1000).optional(),
}).strict();

export const CourseNodeSchema = z.object({
  ...commonFields,
  parentDigestVersion: z.number().int().min(1),
  summary: z.string().max(1000).optional(),
}).strict();

export const ChapterNodeSchema = z.object({
  ...commonFields,
  parentDigestVersion: z.number().int().min(1),
  summary: z.string().max(1000).optional(),
}).strict();

export const LessonNodeSchema = z.object({
  ...commonFields,
  parentDigestVersion: z.number().int().min(1),
  kind: z.enum(['theory', 'exercise']),
  theoryContent: z.string().max(20000).optional(),
}).strict();

export const ActivityNodeSchema = z.object({
  ...commonFields,
  parentDigestVersion: z.number().int().min(1),
  // Non validé contre un registre canonique. Le registre des 25 mécaniques (ids canoniques,
  // schémas de payload, cibles cognitives) est un item de Phase 3 de plan.md. Trois vocabulaires
  // d'ids divergents coexistent déjà dans le dépôt : `MechanicId` (src/types/index.ts, 5 ids),
  // `LeconConfig.mechanic` (src/store/progressionTypes.ts, 7 ids différents), et les 25 fichiers
  // de src/mechanics/. Introduire un enum ici en créerait un quatrième. Toute valeur bien formée
  // est acceptée jusqu'à la Phase 3.
  mechanicId: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  contentItemIds: z.array(z.string()).max(500),
}).strict();

export type ProgramNode = z.infer<typeof ProgramNodeSchema>;
export type CourseNode = z.infer<typeof CourseNodeSchema>;
export type ChapterNode = z.infer<typeof ChapterNodeSchema>;
export type LessonNode = z.infer<typeof LessonNodeSchema>;
export type ActivityNode = z.infer<typeof ActivityNodeSchema>;

// Sérialisation déterministe de la chaîne d'ANCÊTRES d'un nœud (racine → parent direct,
// n'inclut PAS le nœud lui-même — `contextDigest` est le contexte hérité des ancêtres, pas
// un résumé du nœud). Conséquence assumée : un `program` (aucun ancêtre) a toujours
// `computeContextDigest([]) === ''`, ce qui est une valeur valide (0..4000 accepte la chaîne vide).
export function computeContextDigest(
  chain: Array<{ level: HierarchyLevel; title: string; summary?: string }>
): string {
  const serialized = chain
    .map((ancestor) => `[${ancestor.level}] ${ancestor.title}${ancestor.summary ? ` — ${ancestor.summary}` : ''}`)
    .join('\n');
  return serialized.slice(0, 4000);
}

// Détection de rance en O(1) : une seule lecture, celle du parent direct.
//
// Limitation connue et assumée : la rance se propage paresseusement, un niveau à la fois.
// La modification d'un grand-parent n'est pas détectable chez le petit-enfant tant que le
// parent n'a pas lui-même été rafraîchi (son propre `digestVersion` recalculé). C'est le prix
// assumé du coût O(1) — un job de cascade qui résoudrait ce point est hors portée de cet item.
export function isDigestStale(
  node: { parentDigestVersion: number | null },
  parent: { digestVersion: number } | null
): boolean {
  return parent !== null && node.parentDigestVersion !== parent.digestVersion;
}

export interface HierarchyIds {
  tenantId: string;
  programId?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  activityId?: string;
}

const COLLECTION_BY_LEVEL: Record<HierarchyLevel, string> = {
  program: 'programs',
  course: 'courses',
  chapter: 'chapters',
  lesson: 'lessons',
  activity: 'activities',
};

const ID_KEY_BY_LEVEL: Record<HierarchyLevel, keyof HierarchyIds> = {
  program: 'programId',
  course: 'courseId',
  chapter: 'chapterId',
  lesson: 'lessonId',
  activity: 'activityId',
};

export function firestorePathFor(level: HierarchyLevel, ids: HierarchyIds): string {
  if (!ids.tenantId) {
    throw new Error('firestorePathFor: tenantId is required');
  }

  const segments = [`tenants/${ids.tenantId}`];
  const levelIndex = HIERARCHY_LEVELS.indexOf(level);

  for (let i = 0; i <= levelIndex; i++) {
    const currentLevel = HIERARCHY_LEVELS[i];
    const idKey = ID_KEY_BY_LEVEL[currentLevel];
    const id = ids[idKey];
    if (!id) {
      throw new Error(`firestorePathFor: missing "${idKey}" for level "${level}"`);
    }
    segments.push(`${COLLECTION_BY_LEVEL[currentLevel]}/${id}`);
  }

  return segments.join('/');
}
