import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// SSR : le serveur Node de ce site (Cloud Run) est un environnement de confiance,
// au même titre que server.ts — on utilise donc le SDK Admin (Application Default
// Credentials, pas de clé de service en dur) plutôt que le SDK client, qui exigerait
// un accès Firestore public pour fonctionner sans utilisateur connecté.
const app = getApps().length ? getApp() : initializeApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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

function toTenantConfig(id: string, data: FirebaseFirestore.DocumentData): TenantConfig {
  return {
    id,
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
    domain: data.domain,
  };
}

export async function getTenantConfig(domainOrId: string | undefined): Promise<TenantConfig | null> {
  if (!domainOrId) return null;

  try {
    const tenantsRef = db.collection('tenants');

    // On peut chercher par ID ou par domaine configuré
    const snapshot = await tenantsRef.where('domain', '==', domainOrId).limit(1).get();
    if (!snapshot.empty) {
      return toTenantConfig(snapshot.docs[0].id, snapshot.docs[0].data());
    }

    // Fallback: chercher par ID
    const snapshotById = await tenantsRef.where('id', '==', domainOrId).limit(1).get();
    if (!snapshotById.empty) {
      return toTenantConfig(snapshotById.docs[0].id, snapshotById.docs[0].data());
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
    const docSnap = await db.collection('products').doc(productId).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching product", e);
  }
  return null;
}

export async function getCourse(courseId: string) {
  try {
    const docSnap = await db.collection('courses').doc(courseId).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching course", e);
  }
  return null;
}

export async function getBundle(bundleId: string) {
  try {
    const docSnap = await db.collection('bundles').doc(bundleId).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (e) {
    console.error("Error fetching bundle", e);
  }
  return null;
}
