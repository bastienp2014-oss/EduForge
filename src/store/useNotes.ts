import { create } from 'zustand';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useTenant } from './useTenant';

// ─── Types and Constants ──────────────────────────────────────────────────

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface NotesState {
  noteText: string;
  isLoading: boolean;
  isSaving: boolean;
  lastUpdated: string | null;
  error: string | null;
  
  // Actions
  chargerNotes: () => Promise<void>;
  setNoteTextLocally: (text: string) => void;
  sauvegarderNotes: (text: string) => Promise<void>;
  clearError: () => void;
}

// ─── Store ──────────────────────────────────────────────────────────────

export const useNotes = create<NotesState>((set, get) => ({
  noteText: '',
  isLoading: false,
  isSaving: false,
  lastUpdated: null,
  error: null,

  clearError: () => set({ error: null }),

  chargerNotes: async () => {
    const user = auth.currentUser;
    if (!user) return;

    set({ isLoading: true });
    const path = `notes/${user.uid}`;
    try {
      const docRef = doc(db, 'notes', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          noteText: data.noteText || '',
          lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.seconds * 1000).toISOString() : null,
          isLoading: false,
          error: null
        });
      } else {
        set({ noteText: '', lastUpdated: null, isLoading: false, error: null });
      }
    } catch (error) {
      console.error('[Notes] Erreur de chargement Firestore:', error);
      const errorMessage = error instanceof Error ? error.message : "Erreur de chargement.";
      set({ isLoading: false, error: errorMessage });
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  setNoteTextLocally: (text: string) => {
    set({ noteText: text });
  },

  sauvegarderNotes: async (text: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const tenantId = useTenant.getState().currentTenant?.id || 'eduforge';
    const path = `notes/${user.uid}`;

    set({ isSaving: true });
    try {
      const docRef = doc(db, 'notes', user.uid);
      await setDoc(docRef, {
        tenantId,
        userId: user.uid,
        noteText: text,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      set({
        isSaving: false,
        lastUpdated: new Date().toISOString(),
        error: null
      });
    } catch (error) {
      console.error('[Notes] Erreur de sauvegarde Firestore:', error);
      const errorMessage = error instanceof Error ? error.message : "Erreur de synchronisation avec le serveur.";
      set({ isSaving: false, error: errorMessage });
      
      // Fallback native visual notification
      alert("Erreur: Impossible de synchroniser vos notes avec le serveur.");
      
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}));
