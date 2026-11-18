import { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '';
export type SeoMetadata = { title: string; description: string; noindex?: boolean; image?: string };
export const SeoContext = createContext<{ metadata?: SeoMetadata } | null>(null);

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function Seo({ title, description, noindex = false, image }: { title: string; description: string; noindex?: boolean; image?: string }) {
  const [loc] = useLocation();
  const collector = useContext(SeoContext);
  if (collector) collector.metadata = { title, description, noindex, image };
  useEffect(() => {
    const full = title.includes('Monitor') ? title : `${title} | Monitor Inteligencia de Mercado`;
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', document.documentElement.lang === 'en' ? 'en_US' : 'es_MX');
    setMeta('name', 'twitter:title', full);
    setMeta('name', 'twitter:description', description);
    const socialImage = image || '/assets/monitor-official.svg';
    const absoluteImage = new URL(socialImage, SITE_URL || window.location.origin).href;
    setMeta('property', 'og:image', absoluteImage);
    setMeta('name', 'twitter:image', absoluteImage);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (SITE_URL) {
      const href = `${SITE_URL}${loc === '/' ? '/' : loc}`;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = href;
      setMeta('property', 'og:url', href);
    } else if (link) link.remove();
  }, [title, description, noindex, image, loc]);
  return null;
}
