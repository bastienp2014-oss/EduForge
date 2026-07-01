import type { APIRoute } from 'astro';
import { getTenantConfig } from '../lib/tenantApi';

export const GET: APIRoute = async ({ request }) => {
  // Le domaine racine est configuré pour "eduforge" (la plateforme SaaS principale)
  const tenant = 'eduforge';
  const tenantConfig = await getTenantConfig(tenant);
  
  if (!tenantConfig) {
    return new Response(null, { status: 404 });
  }

  const siteUrl = new URL(request.url).origin;

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Page d'accueil racine
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${siteUrl}/</loc>\n`;
  sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;

  // On peut ajouter d'autres pages publiques pour eduforge ici (ex: Tarifs, Fonctionnalités)
  
  sitemap += `</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
