# Prompt pour Claude Opus 4.8 / Claude 3.5 Sonnet

**Contexte à fournir à Claude (avec le fichier `codebase_repomix.md`) :**

Salut Claude ! J'ai restauré une ancienne version du projet Deep Generation OS, et nous avons quelques régressions par rapport au `plan.md` actuel. 

Ton objectif est de corriger la régression identifiée sur la Phase 0, puis d'entamer la Phase 1. 

### 🚨 1. Corriger la régression de la Phase 0 (Sécurité)
Le plan indique que l'email superadmin codé en dur a été retiré. Le backend (`server.ts`, `firestore.rules`) est propre, mais **le front-end a régressé**.
- Fichier : `src/features/admin/AdminScreen.tsx`
- Problème : À la ligne 131, on trouve encore : `const isSuperAdmin = claims?.role === 'superadmin' || auth.currentUser?.email === 'bastienp2014@gmail.com';`
- **Action requise** : Supprime la condition sur l'email hardcodé. Le statut Superadmin ne doit dépendre **que** des custom claims (`claims?.role === 'superadmin'`).

### 🏗️ 2. Avancer sur la Phase 1 (Fondations & Blueprint Engine)
L'application est prête pour la Phase 1. La priorité est de migrer les configurations des locataires (tenants) du stockage local (localStorage) vers la base de données.
- Fichiers cibles : `src/store/useAppConfig.ts` et `src/store/useGames.ts`
- Problème : Ces stores utilisent actuellement le middleware `persist` de Zustand (sauvegarde dans le localStorage). Cela pose un problème pour le multi-tenant car les configurations ne sont pas partagées entre les administrateurs d'un même tenant.
- **Action requise** : 
  - Retire le localStorage pour ces configurations persistantes.
  - Migre ces configurations vers Firestore sous la collection `tenants/{id}/configuration`. 
  - Le store Zustand doit maintenant se synchroniser avec Firestore (lecture au chargement, et écriture lors des modifications). 

### ✅ 3. Mise à jour
- N'oublie pas de cocher les cases correspondantes dans la "Phase 1" du fichier `plan.md` une fois que c'est implémenté.

Merci ! Voici le code source complet de l'application dans le fichier repomix joint.
