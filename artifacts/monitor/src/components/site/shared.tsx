import { type ReactNode } from 'react';
import clientManifest from '../../../public/assets/clients.json';
import { useGetSite, getGetSiteQueryKey, type SiteContent } from '@workspace/api-client-react';
import { DEFAULT_CONTACT } from '@/lib/content';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { HeroVideo } from './hero-video';

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function useSite() {
  const q = useGetSite({ query: { queryKey: getGetSiteQueryKey(), staleTime: 60_000, retry: 1 } });
  const s = q.data;
  const contact = {
    phone: s?.phone || DEFAULT_CONTACT.phone,
    address: s?.address || DEFAULT_CONTACT.address,
    email: s?.email || DEFAULT_CONTACT.email,
    facebook: s?.facebook || DEFAULT_CONTACT.facebook,
  };
  return { ...q, site: s as SiteContent | undefined, contact };
}

export function telHref(p: string) {
  return `tel:+52${p.replace(/\D/g, '').slice(-10)}`;
}
export function fbHref(f: string) {
  return f.startsWith('http') ? f : `https://${f}`;
}
export function fbLabel(f: string) {
  return f.replace(/^https?:\/\/(www\.)?/, '');
}

export function Reveal({ children, className, as: As = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li' }) {
  return (
    <As className={className}>
      {children}
    </As>
  );
}

export function Wordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <img
      src={`${BASE}/assets/${light ? 'monitor-official-light' : 'monitor-official'}.svg`}
      alt="Monitor, Inteligencia de Mercado"
      className={cn('block h-11 w-auto', className)}
    />
  );
}

export function PageHero({ eyebrow, title, intro, children, backgroundVideo }: { eyebrow: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; backgroundVideo?: { src: string; poster: string } }) {
  return (
    <section className="hero-bg relative overflow-hidden text-white">
      {backgroundVideo && <HeroVideo key={backgroundVideo.src} {...backgroundVideo} />}
      <div className="container-m relative py-16 md:py-24">
        <p className="eyebrow mb-5">{eyebrow}</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] md:text-[3.2rem]" data-testid="text-page-title">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, className, right }: { eyebrow: string; title: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <div className={cn('mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="text-3xl font-bold leading-[1.1] text-navy md:text-[2.5rem]">{title}</h2>
      </div>
      {right}
    </div>
  );
}

type ClientLogo = { name: string; src: string };
function normalizeLogos(raw: unknown): ClientLogo[] {
  const arr = Array.isArray(raw) ? raw : raw && typeof raw === 'object' && Array.isArray((raw as { clients?: unknown[] }).clients) ? (raw as { clients: unknown[] }).clients : [];
  return arr
    .map((it): ClientLogo | null => {
      if (typeof it === 'string') return { name: it.replace(/\.[a-z]+$/i, ''), src: it };
      if (it && typeof it === 'object') {
        const o = it as Record<string, string>;
        const src = o.src || o.file || o.path || o.image || o.url;
        if (!src) return null;
        return { name: o.name || o.alt || o.title || src, src };
      }
      return null;
    })
    .filter((x): x is ClientLogo => !!x)
    .map((l) => ({
      ...l,
      src: /^https?:|^\//.test(l.src) ? (l.src.startsWith('/') && !l.src.startsWith(BASE + '/') ? BASE + l.src : l.src) : `${BASE}/assets/clients/${l.src.replace(/^.*clients\//, '')}`,
    }));
}

export function ClientLogos() {
  const { t } = useLang();
  const logos = normalizeLogos(clientManifest);
  return (
    <section className="border-y border-border bg-mist/60 py-12" aria-labelledby="clients-title" data-testid="section-clients">
      <div className="container-m">
        <p id="clients-title" className="mb-8 text-center text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-text">
          {t('Empresas que confían en nosotros', 'Companies that trust us')}
        </p>
        {logos.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {logos.map((l, i) => (
              <li key={l.src} className="flex h-16 items-center justify-center rounded-lg px-3 md:h-20" data-testid={`img-client-${i}`}>
                <img
                  src={l.src}
                  alt={l.name}
                  loading="lazy"
                  className="max-h-11 w-auto max-w-[78%] object-contain opacity-85 transition-opacity hover:opacity-100 md:max-h-12"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}
