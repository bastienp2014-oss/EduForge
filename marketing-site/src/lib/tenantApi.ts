import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit, initializeFirestore } from 'firebase/firestore';
import type { TenantConfig } from './tenantApi';

// Initialisation conditionnelle pour le SSR
const firebaseConfig = {
  "projectId": "gen-lang-client-0808256771",
  "appId": "1:906490759700:web:abba0155b3d3f6e5c33501",
  "apiKey": "AIzaSyCp9VBssCMQFQv2kzN7ZX6dT3SsMh4C0jQ",
  "authDomain": "gen-lang-client-0808256771.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-f07a6670-0671-4de0-9caf-b551ab6f37a7",
  "storageBucket": "gen-lang-client-0808256771.firebasestorage.app",
  "messagingSenderId": "906490759700",
  "measurementId": ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let db;
try {
  db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export interface TenantConfig {
  id: string;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    fontFamily: string;
  };
  marketing: {
    siteTitle: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  seo?: {
    description: string;
    keywords: string[];
    ogImage?: string;
  };
  domain?: string;
}

export async function getTenantConfig(domainOrId: string | undefined): Promise<TenantConfig | null> {
  if (!domainOrId) return null;

  try {
    const tenantsRef = collection(db, 'tenants');
    
    // On peut chercher par ID ou par domaine configuré
    const q = query(
      tenantsRef, 
      where('domain', '==', domainOrId), 
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        theme: data.theme || {
          primary: '#10b981',
          secondary: '#6ee7b7',
          background: '#ffffff',
          text: '#111827',
          fontFamily: 'Inter',
        },
        marketing: data.marketing || {
          siteTitle: data.name || 'Plateforme',
          heroTitle: 'Bienvenue',
          heroSubtitle: 'Découvrez notre méthodologie interactive.',
        },
        seo: data.seo || {},
        domain: data.domain
      };
    }
    
    // Fallback: chercher par ID
    const qById = query(
      tenantsRef, 
      where('id', '==', domainOrId), 
      limit(1)
    );
    const snapshotById = await getDocs(qById);
    if (!snapshotById.empty) {
      const data = snapshotById.docs[0].data();
      return {
        id: snapshotById.docs[0].id,
        theme: data.theme || {
          primary: '#10b981',
          secondary: '#6ee7b7',
          background: '#ffffff',
          text: '#111827',
          fontFamily: 'Inter',
        },
        marketing: data.marketing || {
          siteTitle: data.name || 'Plateforme',
          heroTitle: 'Bienvenue',
          heroSubtitle: 'Découvrez notre méthodologie interactive.',
        },
        seo: data.seo || {},
        domain: data.domain
      };
    }

  } catch (error) {
    console.error("Erreur lors de la récupération du tenant:", error);
  }

  // Fallback de démonstration si le tenant n'est pas trouvé
  return {
    id: domainOrId,
    theme: {
      primary: '#10b981',
      secondary: '#6ee7b7',
      background: '#ffffff',
      text: '#111827',
      fontFamily: 'Inter',
    },
    marketing: {
      siteTitle: `Plateforme Interactive`,
      heroTitle: `Bienvenue sur notre plateforme`,
      heroSubtitle: 'Découvrez notre méthodologie interactive.',
    },
    seo: {
      description: `Découvrez notre plateforme interactive.`,
      keywords: ["plateforme", "interactive"],
    }
  };
}

export async function getProduct(productId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching product", e);
  }
  return null;
}

export async function getCourse(courseId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching course", e);
  }
  return null;
}

export async function getBundle(bundleId: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'bundles', bundleId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching bundle", e);
  }
  return null;
}
