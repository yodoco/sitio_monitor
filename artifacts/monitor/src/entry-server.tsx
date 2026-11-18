import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGetSiteQueryKey, type SiteContent } from '@workspace/api-client-react';
import { Router } from 'wouter';
import { LanguageProvider } from '@/lib/i18n';
import { SERVICES } from '@/lib/content';
import { SeoContext, type SeoMetadata } from '@/components/site/seo';
import { PublicRoutes } from './public-routes';

const fixedPaths = new Set(['/', '/servicios', '/quienes-somos', '/insights', '/contacto', '/aviso-de-privacidad']);
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));

export function render(url: string, input: SiteContent, origin: string) {
  const pathname = new URL(url, origin).pathname;
  // Never embed drafts, even if a caller accidentally supplies an admin response.
  const site = { ...input, pages: input.pages.filter(p => p.published), insights: input.insights.filter(p => p.published) };
  const exists = fixedPaths.has(pathname)
    || SERVICES.some(s => pathname === `/servicios/${s.slug}`)
    || site.insights.some(p => pathname === `/insights/${p.slug}`)
    || site.pages.some(p => pathname === `/paginas/${p.slug}`);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(getGetSiteQueryKey(), site);
  const collector: { metadata?: SeoMetadata } = {};
  let html: string;
  try {
    html = renderToString(
      <QueryClientProvider client={client}>
        <LanguageProvider>
          <Router ssrPath={url}>
            <SeoContext.Provider value={collector}><PublicRoutes /></SeoContext.Provider>
          </Router>
        </LanguageProvider>
      </QueryClientProvider>,
    );
  } finally {
    client.clear();
  }
  if (!collector.metadata) throw new Error('Missing SEO metadata for rendered route');
  const metadata = collector.metadata;
  const title = metadata.title.includes('Monitor') ? metadata.title : `${metadata.title} | Monitor Inteligencia de Mercado`;
  const canonical = new URL(pathname, origin).href;
  const image = new URL(metadata.image || '/assets/monitor-official.svg', origin).href;
  const article = site.insights.some(p => pathname === `/insights/${p.slug}`);
  const head = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(metadata.description)}">`,
    `<meta name="robots" content="${exists && !metadata.noindex ? 'index, follow' : 'noindex, nofollow'}">`,
    `<link rel="canonical" href="${escape(canonical)}">`,
    ...Object.entries({
      'og:title': title, 'og:description': metadata.description, 'og:url': canonical,
      'og:image': image, 'og:type': article ? 'article' : 'website', 'og:locale': 'es_MX',
      'og:site_name': 'Monitor Inteligencia de Mercado',
    }).map(([key, value]) => `<meta property="${key}" content="${escape(value)}">`),
    ...Object.entries({
      'twitter:card': 'summary_large_image', 'twitter:title': title,
      'twitter:description': metadata.description, 'twitter:image': image,
    }).map(([key, value]) => `<meta name="${key}" content="${escape(value)}">`),
  ].join('\n');
  const data = JSON.stringify(site).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return { html, head, data, status: exists ? 200 : 404 };
}
