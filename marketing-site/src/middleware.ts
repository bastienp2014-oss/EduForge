import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname;
  
  // Domaines principaux de la plateforme (où le routage se fait par le path : /tenant-id)
  const mainDomains = [
    'localhost',
    '127.0.0.1',
    'run.app' // Pour Cloud Run (ex: ais-dev-xyz.run.app)
  ];
  
  const isMainDomain = mainDomains.some(d => hostname.includes(d));

  // Si c'est le domaine principal, on laisse le routage normal faire son travail (par path)
  if (isMainDomain) {
    return next();
  }

  // Exclure les requêtes vers les assets statiques et fichiers internes
  if (url.pathname.startsWith('/_astro') || url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return next();
  }

  // Si c'est un domaine personnalisé (ex: www.mon-ecole.com),
  // on réécrit la requête en interne vers /[domaine]
  // Ainsi, le routeur d'Astro utilisera [tenant]/index.astro pour répondre à cette requête,
  // et le paramètre 'tenant' aura pour valeur le hostname.
  const targetPath = `/${hostname}${url.pathname === '/' ? '' : url.pathname}`;
  
  try {
    // Astro 4+ permet d'utiliser context.rewrite() pour le routage interne
    return context.rewrite(targetPath);
  } catch (e) {
    // Fallback si rewrite n'est pas disponible (anciennes versions)
    // On modifie l'URL de la requête et on rappelle next
    return next(new Request(new URL(targetPath, url.origin), context.request));
  }
});
