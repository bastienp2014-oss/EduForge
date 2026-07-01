import { ContentItem, ContentTag } from '../types';
import motsData from '../data/mots.json';
import anglicismesData from '../data/anglicismes.json';
import quizData from '../data/quiz.json';
import { useProgression } from '../store/useProgression';

// ─── Interface ContentProvider (Adaptée pour le Hub) ───────────────
export interface ContentProvider {
  getItemsByNiveau(niveauUtilisateur: number): ContentItem[];
}

// ─── LocalJsonContentProvider ────────────────────────────────────
export class LocalJsonContentProvider implements ContentProvider {
  getItemsByNiveau(niveauUtilisateur: number): ContentItem[] {
    
    // Transformation des mots
    const mots: ContentItem[] = (motsData as any[])
      .map((m) => ({
        id: m.id,
        module: 'mots',
        niveau: m.niveau || 1, // Assumer 1 par défaut
        tags: ['vocabulaire', 'mot-court'] as ContentTag[],
        payload: {
          question: undefined,
          answer: m.mot,
          translation: m.definition,
          exemple: m.exemple,
        }
      }));

    // Transformation des anglicismes
    const anglicismes: ContentItem[] = (anglicismesData as any[])
      .map((a) => ({
        id: a.id,
        module: 'anglicismes',
        niveau: a.niveau || 1,
        tags: ['vocabulaire', 'faux-ami'] as ContentTag[],
        payload: {
          question: `${a.standard} → en québécois ?`,
          answer: a.quebecois,
          exemple: a.exemple,
          translation: a.standard,
        }
      }));

    // Transformation des quiz
    const quiz: ContentItem[] = (quizData as any[])
      .map((q) => ({
        id: q.id,
        module: 'quiz',
        niveau: q.niveau || 1,
        tags: ['grammaire', 'qcm-ready'] as ContentTag[],
        payload: {
          question: q.question,
          answer: q.options[q.bonne_reponse],
          options: q.options,
          exemple: q.explication,
        }
      }));

    const customItems = useProgression.getState().customContentItems || [];

    const allContent = [...mots, ...anglicismes, ...quiz, ...customItems];
    
    // Filtrage final par niveau
    return allContent.filter(item => item.niveau <= niveauUtilisateur);
  }
}

// ─── Instance singleton ───────────────────────────────────────────
export const contentProvider = new LocalJsonContentProvider();
