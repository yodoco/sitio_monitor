import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown, ChevronRight, Facebook, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { SERVICES } from '@/lib/content';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Wordmark, fbHref, fbLabel, telHref, useSite } from './shared';

function LangSwitch({ light }: { light?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-1 text-xs font-semibold" role="group" aria-label="Idioma / Language">
      {(['es', 'en'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i === 1 && <span className={light ? 'text-white/30' : 'text-border'}>|</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            data-testid={`button-lang-${l}`}
            className={cn('rounded px-1 py-0.5 uppercase transition-colors', lang === l ? (light ? 'text-white' : 'text-navy') : light ? 'text-white/50 hover:text-white' : 'text-slate-text hover:text-navy')}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}

function Header() {
  const { t, lang } = useLang();
  const { site, contact } = useSite();
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);
  const [mSvc, setMSvc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setOpen(false); setSvcOpen(false); }, [loc]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const menuPages = (site?.pages ?? []).filter((p) => p.published && p.showInMenu);
  const nav = [
    { href: '/', label: t('Inicio', 'Home') },
    { href: '/servicios', label: t('Servicios', 'Services'), dropdown: true },
    { href: '/quienes-somos', label: t('Quiénes somos', 'About us') },
    { href: '/insights', label: 'Insights' },
    ...menuPages.map((p) => ({ href: `/paginas/${p.slug}`, label: p.title })),
    { href: '/contacto', label: t('Contacto', 'Contact') },
  ];
  const isActive = (h: string) => (h === '/' ? loc === '/' : loc === h || loc.startsWith(h + '/'));

  return (
    <header className="sticky top-0 z-50">
      <div className={cn('bg-navy-deep text-white/75 transition-[margin] duration-300', scrolled ? '-mt-9' : 'mt-0')}>
        <div className="container-m flex h-9 items-center justify-between text-[0.72rem]">
          <div className="flex min-w-0 items-center gap-4">
            <a href={telHref(contact.phone)} className="flex items-center gap-1.5 hover:text-white" data-testid="link-topbar-phone"><Phone className="h-3 w-3" />{contact.phone}</a>
            <span className="hidden items-center gap-1.5 truncate md:flex"><MapPin className="h-3 w-3" />{contact.address}</span>
          </div>
          <LangSwitch light />
        </div>
      </div>
      <div className={cn('border-b bg-background/95 backdrop-blur transition-shadow', scrolled ? 'border-border shadow-sm' : 'border-transparent')}>
        <div className="container-m flex h-[70px] items-center justify-between gap-6">
          <Link href="/" data-testid="link-logo" aria-label="Monitor — Inicio"><Wordmark /></Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t('Principal', 'Main')}>
            {nav.map((n) =>
              n.dropdown ? (
                <div
                  key={n.href}
                  className="relative"
                  onMouseEnter={() => { window.clearTimeout(closeTimer.current); setSvcOpen(true); }}
                  onMouseLeave={() => { closeTimer.current = window.setTimeout(() => setSvcOpen(false), 140); }}
                >
                  <button
                    type="button"
                    aria-expanded={svcOpen}
                    aria-haspopup="true"
                    onClick={() => setSvcOpen((v) => !v)}
                    onKeyDown={(e) => e.key === 'Escape' && setSvcOpen(false)}
                    data-testid="button-nav-servicios"
                    className={cn('flex items-center gap-1 rounded-full px-3 py-2 text-[0.86rem] font-medium transition-colors', isActive(n.href) ? 'text-sky' : 'text-ink hover:text-sky')}
                  >
                    {n.label}<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', svcOpen && 'rotate-180')} />
                  </button>
                  <div className={cn('absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3 transition-all duration-200', svcOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0')}>
                    <div className="rounded-2xl border border-border bg-popover p-3 shadow-xl">
                      <div className="grid grid-cols-2 gap-1">
                        {SERVICES.map((s) => (
                          <Link key={s.slug} href={`/servicios/${s.slug}`} data-testid={`link-menu-service-${s.slug}`} className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-accent">
                            <span className="block text-sm font-semibold text-navy group-hover:text-sky">{s.title[lang]}</span>
                            <span className="mt-0.5 line-clamp-1 block text-xs text-slate-text">{s.short[lang]}</span>
                          </Link>
                        ))}
                      </div>
                      <Link href="/servicios" className="mt-2 flex items-center justify-between rounded-xl bg-mist px-4 py-3 text-sm font-semibold text-navy hover:text-sky" data-testid="link-menu-all-services">
                        {t('Ver todos los servicios', 'See all services')}<ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={n.href}
                  href={n.href}
                  data-testid={`link-nav-${n.href.replace(/\//g, '') || 'inicio'}`}
                  className={cn('relative rounded-full px-3 py-2 text-[0.86rem] font-medium transition-colors', isActive(n.href) ? 'text-sky' : 'text-ink hover:text-sky')}
                >
                  {n.label}
                  {isActive(n.href) && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded bg-sky" />}
                </Link>
              ),
            )}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/contacto?modo=cotizacion" className="btn-primary !py-2.5" data-testid="link-cta-header">{t('Trabajemos juntos', "Let's work together")}</Link>
          </div>
          <button type="button" className="rounded-lg p-2 text-navy lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? t('Cerrar menú', 'Close menu') : t('Abrir menú', 'Open menu')} aria-expanded={open} data-testid="button-mobile-menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[70px] overflow-y-auto bg-background lg:hidden" data-testid="panel-mobile-menu">
          <nav className="container-m flex flex-col py-4" aria-label={t('Móvil', 'Mobile')}>
            {nav.map((n) =>
              n.dropdown ? (
                <div key={n.href} className="border-b border-border">
                  <button type="button" className="flex w-full items-center justify-between py-4 text-lg font-semibold text-navy" onClick={() => setMSvc((v) => !v)} aria-expanded={mSvc} data-testid="button-mobile-services">
                    {n.label}<ChevronDown className={cn('h-5 w-5 transition-transform', mSvc && 'rotate-180')} />
                  </button>
                  {mSvc && (
                    <div className="flex flex-col pb-3">
                      <Link href="/servicios" className="py-2 pl-3 text-sm font-semibold text-sky">{t('Ver todos los servicios', 'See all services')}</Link>
                      {SERVICES.map((s) => (
                        <Link key={s.slug} href={`/servicios/${s.slug}`} className="py-2 pl-3 text-sm text-slate-text" data-testid={`link-mobile-service-${s.slug}`}>{s.title[lang]}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={n.href} href={n.href} className={cn('border-b border-border py-4 text-lg font-semibold', isActive(n.href) ? 'text-sky' : 'text-navy')}>{n.label}</Link>
              ),
            )}
            <Link href="/contacto?modo=cotizacion" className="btn-primary mt-6 justify-center">{t('Trabajemos juntos', "Let's work together")}</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { t, lang } = useLang();
  const { contact } = useSite();
  const footerServices = ['estudio-de-mercado-integral', 'levantamiento-de-campo', 'focus-groups', 'mystery-shopper', 'mineria-de-datos'];
  const svcLabel: Record<string, [string, string]> = {
    'estudio-de-mercado-integral': ['Estudio de Mercado', 'Market Study'],
    'levantamiento-de-campo': ['Levantamiento de Encuestas', 'Survey Fieldwork'],
  };
  return (
    <footer className="bg-navy-deep text-white/70">
      <div className="container-m grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Wordmark light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">{t('Hagamos el mejor equipo. Inteligencia de mercado para decidir con certeza.', "Let's make the best team. Market intelligence to decide with certainty.")}</p>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{t('Servicios', 'Services')}</h3>
          <ul className="space-y-2.5 text-sm">
            {footerServices.map((slug) => {
              const s = SERVICES.find((x) => x.slug === slug)!;
              const lbl = svcLabel[slug] ? svcLabel[slug][lang === 'es' ? 0 : 1] : s.title[lang];
              return <li key={slug}><Link href={`/servicios/${slug}`} className="hover:text-white" data-testid={`link-footer-${slug}`}>{lbl}</Link></li>;
            })}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{t('Enlaces rápidos', 'Quick links')}</h3>
          <ul className="space-y-2.5 text-sm">
            {[
              ['/', t('Inicio', 'Home')],
              ['/servicios', t('Servicios', 'Services')],
              ['/quienes-somos', t('Quiénes somos', 'About us')],
              ['/insights', 'Insights'],
              ['/contacto', t('Contacto', 'Contact')],
            ].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow mb-4">{t('Contacto', 'Contact')}</h3>
          <ul className="space-y-3 text-sm">
            <li><a href={telHref(contact.phone)} className="flex gap-2 hover:text-white"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{contact.phone}</a></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{contact.address}</li>
            <li><a href={`mailto:${contact.email}`} className="flex gap-2 hover:text-white"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{contact.email}</a></li>
            <li><a href={fbHref(contact.facebook)} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white" data-testid="link-facebook"><Facebook className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{fbLabel(contact.facebook)}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-m flex flex-col gap-3 py-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>© 2026 Monitor Inteligencia de Mercado. {t('Todos los derechos reservados.', 'All rights reserved.')}</p>
          <Link href="/aviso-de-privacidad" className="hover:text-white" data-testid="link-privacy">{t('Aviso de privacidad', 'Privacy notice')}</Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc]);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-navy focus:px-4 focus:py-2 focus:text-white">Saltar al contenido</a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
