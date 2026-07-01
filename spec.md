# Spécifications Techniques : Phase 5 — PWA + Notifications Push

## 1. PWA de Base (Infrastructure)

### 1.1 Manifest Web
- Fichier : `public/manifest.webmanifest`.
- Métadonnées cibles :
  - `name`: "Mots & Blocs"
  - `short_name`: "MotsBlocs"
  - `theme_color`: "#2563eb" (correspond à `blue-600` dans Tailwind)
  - `background_color`: "#ffffff"
  - `display`: "standalone"
  - `start_url`: "/"
  - `icons`: [512x512 ou 192x192 génériques, placeholders ou générés depuis une source (les assets icones de base suffiront pour l'infra)].

### 1.2 Configuration Vite (vite-plugin-pwa)
- Ajout de la dépendance dev `vite-plugin-pwa`.
- Fichier : `vite.config.ts`.
- Stratégie `workbox` (Prudente) : Générer l'App Shell uniquement. Exclure explicitement les ressources volumineuses (audios ou très gros JSON de contenu) dont la mise en cache agressive est réservée à la Phase 12.
- Intégrer l'inclusion du type standard du service worker et la gestion PWA en mode `autoUpdate` ou `prompt`.

### 1.3 Entrée Index
- Fichier : `index.html`.
- Implémenter le lien vers le webmanifest : `<link rel="manifest" href="/manifest.webmanifest">`.
- Configurer la balise meta `theme-color` associée.

## 2. Firebase Cloud Messaging (FCM)

### 2.1 Firebase Console (Tâches Pré-Requises pour l'Admin)
1. Aller dans le projet Firebase de l'application via la console.
2. Activer les services *Firebase Cloud Messaging API*.
3. Naviguer vers : *Paramètres du projet > Cloud Messaging*.
4. Sous la rubrique *Web Push certificates*, générer ou récupérer la clé VAPID (Paire de clés de notification Web Push).
5. Copier cette clé et l'injecter en local sous le nom de variable `VITE_FIREBASE_VAPID_KEY`.

### 2.2 Variables d'Environnement
- Fichier : `.env.example`.
- Ajout de : `VITE_FIREBASE_VAPID_KEY=` suivi de directives documentant sa nécessité.

### 2.3 Service Worker FCM Indépendant
- Fichier : `public/firebase-messaging-sw.js`.
- Rôle : Assurer le contexte d'exécution en arrière-plan pour intercepter les envois FCM lorsque l'app est fermée. Chargement classique `importScripts` vers les librairies compat de firebase version 9+.
- Implémentation : Extraction de la configuration via un trick de build, URL de config ou hardcodage via placeholders de config build-time depuis `vite.config.ts` (ou simplement en standard `getMessaging()` + options par défaut).

### 2.4 Module de Notifications Frontend
- Fichier : `src/services/notifications.ts`.
- Responsabilités du service :
  1. `requestNotificationPermission()` : Appel standard `Notification.requestPermission()`.
  2. `registerForPush(userId)` : Validation si permission "granted".
     - Initialiser la couche messaging de Firebase (`getMessaging(app)`).
     - Solliciter un token `getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })`.
     - Appeler `setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true })` pour associer l'appareil au compte de l'app.
  3. `setupMessageListener()` : Réception via `onMessage()` de Firebase pour lever des toasts (par exemple avec la suite alertes de la lib) si app au premier plan.

## 3. Expérience Utilisateur et Rétention (UX)

### 3.1 Point de Déclenchement
- Fichier ciblés : `src/App.tsx`.
- Principe de non-intrusion : Le trigger *doit* s'effectuer quand le marqueur `hasCompletedOnboarding` devient `true` (et que l'utilisateur est authentifié).
- L'appel se fera via un useEffect sensible à la transition "onboarding non fini" -> "onboarding fini", en injectant la méthode de `notifications.ts`. Cela évite la redoutable popup à froid. On ne bloque pas non plus le flux de navigation direct.
