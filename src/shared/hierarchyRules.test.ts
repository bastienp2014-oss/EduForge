import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ActivityNodeSchema,
  ChapterNodeSchema,
  CourseNodeSchema,
  HierarchyLevel,
  LessonNodeSchema,
  ProgramNodeSchema,
  firestorePathFor,
} from './hierarchy';

// Preuve exécutable des ACs de plan.md Phase 1, item #1 (hiérarchie de contenu à 5
// niveaux) contre le firestore.rules réel du dépôt, via l'émulateur Firestore.

let testEnv: RulesTestEnvironment;

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const NOW = '2026-07-08T00:00:00.000Z';

const FIXED_IDS = {
  programId: 'p1',
  courseId: 'c1',
  chapterId: 'ch1',
  lessonId: 'l1',
  activityId: 'a1',
};

interface LevelDef {
  level: HierarchyLevel;
  schema: z.ZodTypeAny;
  extraFields: Record<string, unknown>;
}

const LEVELS: LevelDef[] = [
  { level: 'program', schema: ProgramNodeSchema, extraFields: {} },
  { level: 'course', schema: CourseNodeSchema, extraFields: {} },
  { level: 'chapter', schema: ChapterNodeSchema, extraFields: {} },
  { level: 'lesson', schema: LessonNodeSchema, extraFields: { kind: 'theory' } },
  {
    level: 'activity',
    schema: ActivityNodeSchema,
    extraFields: { mechanicId: '02_multiple_choice', contentItemIds: [] },
  },
];

const ID_FOR_LEVEL: Record<HierarchyLevel, string> = {
  program: FIXED_IDS.programId,
  course: FIXED_IDS.courseId,
  chapter: FIXED_IDS.chapterId,
  lesson: FIXED_IDS.lessonId,
  activity: FIXED_IDS.activityId,
};

function docPath(level: HierarchyLevel, tenantId: string, ids: Partial<typeof FIXED_IDS> = FIXED_IDS): string {
  return firestorePathFor(level, { tenantId, ...FIXED_IDS, ...ids });
}

function nodeData(def: LevelDef, tenantId: string, overrides: Record<string, unknown> = {}) {
  const id = (overrides.id as string | undefined) ?? ID_FOR_LEVEL[def.level];
  return def.schema.parse({
    id,
    tenantId,
    title: `Titre ${def.level}`,
    order: 0,
    status: 'draft',
    createdAt: NOW,
    updatedAt: NOW,
    contextDigest: '',
    digestVersion: 1,
    parentDigestVersion: def.level === 'program' ? null : 1,
    digestComputedAt: NOW,
    ...def.extraFields,
    ...overrides,
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'eduforge-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('firestore.rules — hiérarchie de contenu (5 niveaux)', () => {
  it('T1 — isolation multi-tenant : un membre de tenant-a ne peut pas lire un nœud de tenant-b, à tous les niveaux', async () => {
    for (const def of LEVELS) {
      const path = docPath(def.level, TENANT_B);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), path), nodeData(def, TENANT_B, { status: 'published' }));
      });

      const member = testEnv.authenticatedContext('t1-member', { tenantId: TENANT_A });
      await assertFails(getDoc(doc(member.firestore(), path)));
    }
  });

  it('T2 — isolation multi-tenant : un membre de tenant-a (creator) ne peut pas écrire un nœud de tenant-b, à tous les niveaux', async () => {
    for (const def of LEVELS) {
      const path = docPath(def.level, TENANT_B);
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), path), nodeData(def, TENANT_B));
      });

      const creator = testEnv.authenticatedContext('t2-creator', { role: 'creator', tenantId: TENANT_A });
      await assertFails(
        setDoc(doc(creator.firestore(), path), nodeData(def, TENANT_B, { digestVersion: 2, title: 'Intrusion' }))
      );
    }
  });

  it('T3 — porte brouillon : un membre simple ne peut pas lire un nœud draft', async () => {
    const path = docPath('program', TENANT_A, { programId: 'draft-prog' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'draft-prog',
          tenantId: TENANT_A,
          title: 'Programme brouillon',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const member = testEnv.authenticatedContext('t3-member', { tenantId: TENANT_A });
    await assertFails(getDoc(doc(member.firestore(), path)));
  });

  it('T4 — porte brouillon : le même membre peut lire un nœud published (second document)', async () => {
    const path = docPath('program', TENANT_A, { programId: 'published-prog' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'published-prog',
          tenantId: TENANT_A,
          title: 'Programme publié',
          order: 0,
          status: 'published',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const member = testEnv.authenticatedContext('t4-member', { tenantId: TENANT_A });
    await assertSucceeds(getDoc(doc(member.firestore(), path)));
  });

  it('T5 — porte brouillon : un creator du tenant peut lire un nœud draft', async () => {
    const path = docPath('program', TENANT_A, { programId: 'draft-for-creator' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'draft-for-creator',
          tenantId: TENANT_A,
          title: 'Programme brouillon (creator)',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const creator = testEnv.authenticatedContext('t5-creator', { role: 'creator', tenantId: TENANT_A });
    await assertSucceeds(getDoc(doc(creator.firestore(), path)));
  });

  it('T6 — RBAC écriture : un creator crée puis met à jour un nœud', async () => {
    const path = docPath('program', TENANT_A, { programId: 'create-update-prog' });
    const creator = testEnv.authenticatedContext('t6-creator', { role: 'creator', tenantId: TENANT_A });
    const ref = doc(creator.firestore(), path);

    await assertSucceeds(
      setDoc(
        ref,
        ProgramNodeSchema.parse({
          id: 'create-update-prog',
          tenantId: TENANT_A,
          title: 'Version 1',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );

    await assertSucceeds(
      setDoc(
        ref,
        ProgramNodeSchema.parse({
          id: 'create-update-prog',
          tenantId: TENANT_A,
          title: 'Version 2',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 2,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );
  });

  it('T7 — RBAC écriture : un membre simple ne peut pas créer un nœud', async () => {
    const path = docPath('program', TENANT_A, { programId: 'member-create-attempt' });
    const member = testEnv.authenticatedContext('t7-member', { tenantId: TENANT_A });

    await assertFails(
      setDoc(
        doc(member.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'member-create-attempt',
          tenantId: TENANT_A,
          title: 'Tentative',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );
  });

  it('T8 — RBAC suppression : un creator ne peut pas supprimer un nœud', async () => {
    const path = docPath('program', TENANT_A, { programId: 'to-delete-by-creator' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'to-delete-by-creator',
          tenantId: TENANT_A,
          title: 'À supprimer',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const creator = testEnv.authenticatedContext('t8-creator', { role: 'creator', tenantId: TENANT_A });
    await assertFails(deleteDoc(doc(creator.firestore(), path)));
  });

  it('T9 — RBAC suppression : un admin du tenant peut supprimer un nœud', async () => {
    const path = docPath('program', TENANT_A, { programId: 'to-delete-by-admin' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'to-delete-by-admin',
          tenantId: TENANT_A,
          title: 'À supprimer (admin)',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const admin = testEnv.authenticatedContext('t9-admin', { role: 'admin', tenantId: TENANT_A });
    await assertSucceeds(deleteDoc(doc(admin.firestore(), path)));
  });

  it('T10 — cohérence tenantId : un creator ne peut pas créer avec un tenantId différent du chemin', async () => {
    const path = docPath('program', TENANT_A, { programId: 'tenant-mismatch' });
    const creator = testEnv.authenticatedContext('t10-creator', { role: 'creator', tenantId: TENANT_A });

    await assertFails(
      setDoc(
        doc(creator.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'tenant-mismatch',
          tenantId: TENANT_B,
          title: 'Mismatch tenantId',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );
  });

  it("T11 — cohérence id : un creator ne peut pas créer avec un id différent de celui du document", async () => {
    const path = docPath('program', TENANT_A, { programId: 'program-x' });
    const creator = testEnv.authenticatedContext('t11-creator', { role: 'creator', tenantId: TENANT_A });

    await assertFails(
      setDoc(
        doc(creator.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'program-y',
          tenantId: TENANT_A,
          title: 'Mismatch id',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );
  });

  it('T12 — monotonie du digest : une mise à jour avec digestVersion inférieur est refusée', async () => {
    const path = docPath('program', TENANT_A, { programId: 'digest-regression' });
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'digest-regression',
          tenantId: TENANT_A,
          title: 'V2',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 2,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      );
    });

    const creator = testEnv.authenticatedContext('t12-creator', { role: 'creator', tenantId: TENANT_A });
    await assertFails(
      setDoc(
        doc(creator.firestore(), path),
        ProgramNodeSchema.parse({
          id: 'digest-regression',
          tenantId: TENANT_A,
          title: 'V1 régressé',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );
  });

  it('T13 — chaîne complète : un creator crée les 5 niveaux imbriqués puis relit la feuille activity', async () => {
    const creator = testEnv.authenticatedContext('t13-creator', { role: 'creator', tenantId: TENANT_A });
    const ids = {
      programId: 'chain-program',
      courseId: 'chain-course',
      chapterId: 'chain-chapter',
      lessonId: 'chain-lesson',
      activityId: 'chain-activity',
    };

    const programPath = firestorePathFor('program', { tenantId: TENANT_A, ...ids });
    await assertSucceeds(
      setDoc(
        doc(creator.firestore(), programPath),
        ProgramNodeSchema.parse({
          id: ids.programId,
          tenantId: TENANT_A,
          title: 'Programme chaîne',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '',
          digestVersion: 1,
          parentDigestVersion: null,
          digestComputedAt: NOW,
        })
      )
    );

    const coursePath = firestorePathFor('course', { tenantId: TENANT_A, ...ids });
    await assertSucceeds(
      setDoc(
        doc(creator.firestore(), coursePath),
        CourseNodeSchema.parse({
          id: ids.courseId,
          tenantId: TENANT_A,
          title: 'Cours chaîne',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '[program] Programme chaîne',
          digestVersion: 1,
          parentDigestVersion: 1,
          digestComputedAt: NOW,
        })
      )
    );

    const chapterPath = firestorePathFor('chapter', { tenantId: TENANT_A, ...ids });
    await assertSucceeds(
      setDoc(
        doc(creator.firestore(), chapterPath),
        ChapterNodeSchema.parse({
          id: ids.chapterId,
          tenantId: TENANT_A,
          title: 'Chapitre chaîne',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '[program] Programme chaîne\n[course] Cours chaîne',
          digestVersion: 1,
          parentDigestVersion: 1,
          digestComputedAt: NOW,
        })
      )
    );

    const lessonPath = firestorePathFor('lesson', { tenantId: TENANT_A, ...ids });
    await assertSucceeds(
      setDoc(
        doc(creator.firestore(), lessonPath),
        LessonNodeSchema.parse({
          id: ids.lessonId,
          tenantId: TENANT_A,
          title: 'Leçon chaîne',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest: '[program] Programme chaîne\n[course] Cours chaîne\n[chapter] Chapitre chaîne',
          digestVersion: 1,
          parentDigestVersion: 1,
          digestComputedAt: NOW,
          kind: 'theory',
        })
      )
    );

    const activityPath = firestorePathFor('activity', { tenantId: TENANT_A, ...ids });
    await assertSucceeds(
      setDoc(
        doc(creator.firestore(), activityPath),
        ActivityNodeSchema.parse({
          id: ids.activityId,
          tenantId: TENANT_A,
          title: 'Activité chaîne',
          order: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
          contextDigest:
            '[program] Programme chaîne\n[course] Cours chaîne\n[chapter] Chapitre chaîne\n[lesson] Leçon chaîne',
          digestVersion: 1,
          parentDigestVersion: 1,
          digestComputedAt: NOW,
          mechanicId: '02_multiple_choice',
          contentItemIds: [],
        })
      )
    );

    const leafSnap = await assertSucceeds(getDoc(doc(creator.firestore(), activityPath)));
    expect(leafSnap.data()?.title).toBe('Activité chaîne');
  });
});
