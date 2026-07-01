import type { TenantConfig } from '../lib/tenantApi';

interface SEOMetaTags {
  title: string;
  description: string;
  openGraph?: {
    basic: {
      title: string;
      type: string;
      image: string;
    };
  };
  extend?: {
    meta: Array<{ name?: string; content: string; property?: string }>;
  };
}

/**
 * Génère dynamiquement les balises méta SEO (titre, description, open-graph)
 * en combinant la configuration du tenant (Firestore) et les surcharges spécifiques à la page.
 */
export function generateSEOMetaTags(
  tenantConfig: TenantConfig,
  pageOverrides?: {
    title?: string;
    description?: string;
    image?: string;
  }
): SEOMetaTags {
  const siteTitle = tenantConfig.marketing.siteTitle;
  const baseTitle = pageOverrides?.title 
    ? `${pageOverrides.title} | ${siteTitle}` 
    : siteTitle;
    
  const baseDescription = pageOverrides?.description || tenantConfig.marketing.seoDescription || '';
  
  // Image par défaut (si aucune image n'est spécifiée par la page ou le tenant)
  const ogImage = pageOverrides?.image || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80';

  const keywords = tenantConfig.seo?.keywords?.join(', ') || '';
  const themeColor = tenantConfig.theme.primary;

  return {
    title: baseTitle,
    description: baseDescription,
    openGraph: {
      basic: {
        title: baseTitle,
        type: 'website',
        image: ogImage,
      }
    },
    extend: {
      meta: [
        { name: "keywords", content: keywords },
        { name: "theme-color", content: themeColor },
        { property: "og:description", content: baseDescription }
      ]
    }
  };
}
