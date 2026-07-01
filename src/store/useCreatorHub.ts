import { create } from 'zustand';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Course, Bundle } from '../types';

interface CreatorHubState {
  courses: Course[];
  bundles: Bundle[];
  isLoading: boolean;
  error: string | null;
  
  fetchData: (tenantId: string) => Promise<void>;
  createCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>) => Promise<void>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  
  createBundle: (bundle: Omit<Bundle, 'id'>) => Promise<void>;
  updateBundle: (id: string, updates: Partial<Bundle>) => Promise<void>;
  deleteBundle: (id: string) => Promise<void>;
}

export const useCreatorHub = create<CreatorHubState>((set, get) => ({
  courses: [],
  bundles: [],
  isLoading: false,
  error: null,

  fetchData: async (tenantId: string) => {
    if (!tenantId) return;
    set({ isLoading: true, error: null });
    try {
      // Fetch Courses
      const coursesRef = collection(db, 'courses');
      const qCourses = query(coursesRef, where('tenantId', '==', tenantId));
      const coursesSnap = await getDocs(qCourses);
      const courses = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));

      // Fetch Bundles
      const bundlesRef = collection(db, 'bundles');
      const qBundles = query(bundlesRef, where('tenantId', '==', tenantId));
      const bundlesSnap = await getDocs(qBundles);
      const bundles = bundlesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Bundle));

      set({ courses, bundles, isLoading: false });
    } catch (error: any) {
      console.error('Error fetching creator hub data:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  createCourse: async (courseData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const newRef = doc(collection(db, 'courses'));
      const newCourse: Course = {
        id: newRef.id,
        ...courseData,
        authorId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(newRef, {
        ...newCourse,
        // Optional: add server timestamp for strict ordering if needed
        // serverCreatedAt: serverTimestamp(),
      });

      set(state => ({ courses: [...state.courses, newCourse] }));
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  updateCourse: async (id, updates) => {
    try {
      const ref = doc(db, 'courses', id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await setDoc(ref, updateData, { merge: true });
      
      set(state => ({
        courses: state.courses.map(c => c.id === id ? { ...c, ...updateData } : c)
      }));
    } catch (error: any) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  deleteCourse: async (id) => {
    try {
      await deleteDoc(doc(db, 'courses', id));
      set(state => ({ courses: state.courses.filter(c => c.id !== id) }));
    } catch (error: any) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  createBundle: async (bundleData) => {
    try {
      const newRef = doc(collection(db, 'bundles'));
      const newBundle: Bundle = {
        id: newRef.id,
        ...bundleData,
      };

      await setDoc(newRef, newBundle);
      set(state => ({ bundles: [...state.bundles, newBundle] }));
    } catch (error: any) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  },

  updateBundle: async (id, updates) => {
    try {
      const ref = doc(db, 'bundles', id);
      await setDoc(ref, updates, { merge: true });
      
      set(state => ({
        bundles: state.bundles.map(b => b.id === id ? { ...b, ...updates } : b)
      }));
    } catch (error: any) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  },

  deleteBundle: async (id) => {
    try {
      await deleteDoc(doc(db, 'bundles', id));
      set(state => ({ bundles: state.bundles.filter(b => b.id !== id) }));
    } catch (error: any) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  }
}));
