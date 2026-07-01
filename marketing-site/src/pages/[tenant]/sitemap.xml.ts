import type { APIRoute } from 'astro';
import { getTenantConfig } from '../../lib/tenantApi';

export const GET: APIRoute = async ({ params, request }) => {
  const { tenant } = params;
  
  if (!tenant) {
    return new Response(null, { status: 404, statusText: 'Not found' });
  }

  // Vérifier que le tenant (client whitelabel) existe
  const tenantConfig = await getTenantConfig(tenant);
  
  if (!tenantConfig) {
    return new Response(null, {
      status: 404,
      statusText: 'Not found'
    });
  }

  // Dans un cas d'usage réel, ces données (villes et niches ciblées)
  // seraient récupérées depuis Firestore (ex: campagnes SEO actives du tenant).
  // Pour la démonstration du moteur SEO/GEO, on utilise des listes prédéfinies.
  const locations = ['quebec', 'montreal', 'paris', 'lyon'];
  const niches = ['mathematiques', 'francais', 'anglais', 'sciences'];

  // Base URL (déduite de la requête entrante)
  const siteUrl = new URL(request.url).origin;

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Ajouter la page d'accueil du tenant
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${siteUrl}/${tenant}</loc>\n`;
  sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;

  // 2. Générer les URLs dynamiques du Moteur SEO / GEO
  for (const location of locations) {
    for (const niche of niches) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${siteUrl}/${tenant}/${location}/${niche}</loc>\n`;
      // Date arbitraire ou date de mise à jour de la campagne
      sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    }
  }

  sitemap += `</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache d'une heure
    }
  });
};
