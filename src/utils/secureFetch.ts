import { getToken } from 'firebase/app-check';
import { appCheck } from '../services/firebase';

/**
 * Wrapper autour de fetch() pour inclure automatiquement :
 * 1. Le token d'authentification (si l'utilisateur est connecté)
 * 2. Le token Firebase App Check pour protéger nos endpoints Express.
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  
  // 1. App Check Token
  try {
    if (appCheck) {
      const appCheckTokenResponse = await getToken(appCheck, false);
      if (appCheckTokenResponse.token) {
        headers.set('X-Firebase-AppCheck', appCheckTokenResponse.token);
      }
    }
  } catch (error) {
    console.warn("Erreur lors de la récupération du token App Check:", error);
    // On continue quand même, le serveur rejettera si l'App Check est requis.
  }

  // 2. Auth Token (s'il y en a un - géré souvent par un state ou getAuth().currentUser.getIdToken())
  // Note: C'est optionnel ici, à adapter selon comment l'appli gère déjà l'auth.

  const secureOptions: RequestInit = {
    ...options,
    headers,
  };

  return fetch(url, secureOptions);
}
