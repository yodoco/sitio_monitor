import { useMemo, useState } from 'react';
import { Link, useParams, useSearch } from 'wouter';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Download, ExternalLink, FileText, Mail, MapPin, Phone, Facebook } from 'lucide-react';
import { CATEGORY_LABEL, SERVICES, STEPS } from '@/lib/content';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { BASE, ClientLogos, PageHero, Reveal, SectionHead, Skeleton, fbHref, fbLabel, telHref, useSite } from '@/components/site/shared';
import { ContactForm } from '@/components/site/contact-form';
import { AboutMedia, ServiceIcon } from '@/components/site/media';
import { CoverageMap } from '@/components/site/visuals';
import { Seo } from '@/components/site/seo';
import { AboutStats, InsightCard, useHeroCopy } from './home';

function Body({ text }: { text: string }) {
  const paras = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <div className="space-y-5 text-[1.02rem] leading-[1.8] text-slate-text">
      {paras.map((p, i) =>
        p.startsWith('## ') ? <h2 key={i} className="pt-4 text-2xl font-bold text-navy">{p.slice(3)}</h2> : <p key={i} className="whitespace-pre-line">{p}</p>,
      )}
    </div>
  );
}

function CtaBand() {
  const { t } = useLang();
  return (
    <section className="py-16 md:py-20">
      <div className="container-m">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-navy p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">{t('¿Tienes una decisión importante por delante?', 'Facing an important decision?')}</h2>
            <p className="mt-2 text-white/70">{t('Platícanos tu reto y diseñamos el estudio adecuado.', 'Tell us your challenge and we will design the right study.')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contacto?modo=cotizacion" className="btn-primary" data-testid="link-cta-quote">{t('Solicitar cotización', 'Request a quote')}<ChevronRight className="h-4 w-4" /></Link>
            <Link href="/contacto" className="btn-ghost-light">{t('Contacto', 'Contact')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- SERVICES ---------- */
const SERVICE_HERO_VIDEOS: Record<string, string> = {
  'estudios-cuantitativos': 'quantitative-hero',
  'mineria-de-datos': 'data-mining-hero',
  'estudio-de-mercado-integral': 'market-study-hero',
  'estudios-cualitativos': 'focus-groups-hero',
  'levantamiento-de-campo': 'fieldwork-hero',
  'focus-groups': 'focus-groups-hero',
  'entrevistas-a-profundidad': 'in-depth-interviews-hero',
  'mystery-shopper': 'mystery-shopper-hero',
};

export function ServicesPage() {
  const { t, lang } = useLang();
  return (
    <>
      <Seo title={t('Servicios de investigación de mercados', 'Market research services')} description={t('Ocho servicios: estudio de mercado integral, cuantitativos, cualitativos, levantamiento de campo, minería de datos, focus groups, entrevistas a profundidad y mystery shopper.', 'Eight services: comprehensive market study, quantitative, qualitative, fieldwork, data mining, focus groups, in-depth interviews and mystery shopper.')} />
      <PageHero eyebrow={t('Servicios', 'Services')} title={<>{t('Ocho formas de entender', 'Eight ways to understand')} <span className="text-sky">{t('a tu mercado', 'your market')}</span></>}
        intro={t('Combinamos metodologías cuantitativas, cualitativas y de análisis de datos según la decisión que necesitas tomar. Elige un servicio o platícanos tu reto y te recomendamos el enfoque adecuado.', 'We combine quantitative, qualitative and data-analysis methods depending on the decision you need to make. Choose a service or tell us your challenge and we will recommend the right approach.')} />
      <section className="py-16 md:py-24">
        <div className="container-m grid gap-5 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 70}>
              <Link href={`/servicios/${s.slug}`} className="group flex h-full gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-sky/40 hover:shadow-lg md:p-8" data-testid={`card-service-${s.slug}`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-sky"><ServiceIcon slug={s.slug} className="h-6 w-6" /></span>
                <div className="flex-1">
                  <span className="font-mono text-xs text-slate-text">0{i + 1}</span>
                  <h2 className="mt-1 text-xl font-bold text-navy">{s.title[lang]}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-text">{s.short[lang]}</p>
                  <span className="link-arrow mt-4">{t('Ver servicio', 'View service')}<ChevronRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="bg-mist/70 py-16 md:py-24">
        <div className="container-m">
          <SectionHead eyebrow={t('Cómo trabajamos', 'How we work')} title={t('De tu pregunta de negocio a una decisión informada', 'From your business question to an informed decision')} />
          <ol className="grid gap-8 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={i}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 font-bold text-navy">{s.t[lang]}</h3>
                <p className="mt-1.5 text-sm text-slate-text">{s.d[lang]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLang();
  const idx = SERVICES.findIndex((s) => s.slug === slug);
  if (idx < 0) return <NotFoundInline />;
  const s = SERVICES[idx];
  const heroVideo = SERVICE_HERO_VIDEOS[s.slug];
  const next = SERVICES[(idx + 1) % SERVICES.length];
  const blocks = [
    { h: t('Qué recibes', 'What you get'), items: s.deliverables },
    { h: t('Cuándo te conviene', 'When it fits'), items: s.useWhen },
    { h: t('Cómo lo hacemos', 'How we do it'), items: s.method },
  ];
  return (
    <>
      <Seo title={s.title[lang]} description={s.short[lang]} />
      <PageHero eyebrow={t('Servicios', 'Services')} title={s.title[lang]} intro={s.intro[lang]}
        backgroundVideo={heroVideo ? {
          src: `${BASE}/api/storage/public-objects/${heroVideo}.mp4`,
          poster: `${BASE}/assets/services/${heroVideo}-poster.webp`,
        } : undefined}>
        <nav className="mt-6 flex items-center gap-2 text-xs text-white/60" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">{t('Inicio', 'Home')}</Link><ChevronRight className="h-3 w-3" />
          <Link href="/servicios" className="hover:text-white">{t('Servicios', 'Services')}</Link><ChevronRight className="h-3 w-3" />
          <span className="text-white">{s.title[lang]}</span>
        </nav>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/contacto?modo=cotizacion&servicio=${s.slug}`} className="btn-primary" data-testid="link-service-quote">{t('Cotizar este servicio', 'Quote this service')}<ChevronRight className="h-4 w-4" /></Link>
        </div>
      </PageHero>
      <section className="py-16 md:py-24">
        <div className="container-m mb-12">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-mist md:aspect-[21/9]">
            <img src={`${BASE}/assets/services/${s.slug}.webp`} alt={t(`Fotografía del servicio ${s.title.es}`, `Photo for ${s.title.en}`)} loading="lazy" className="h-full w-full object-cover object-center" data-testid="img-service" />
          </div>
        </div>
        <div className="container-m grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {blocks.map((b, i) => (
              <Reveal key={b.h} delay={i * 70} className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold text-navy">{b.h}</h2>
                <ul className="mt-4 space-y-3">
                  {b.items.map((it) => (
                    <li key={it.es} className="flex gap-2.5 text-sm leading-relaxed text-slate-text"><Check className="mt-0.5 h-4 w-4 shrink-0 text-sky" />{it[lang]}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-28">
            <p className="eyebrow mb-3">{t('Otros servicios', 'Other services')}</p>
            <ul className="space-y-1">
              {SERVICES.filter((x) => x.slug !== s.slug).map((x) => (
                <li key={x.slug}><Link href={`/servicios/${x.slug}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium text-navy hover:bg-card hover:text-sky">{x.title[lang]}<ChevronRight className="h-3.5 w-3.5" /></Link></li>
              ))}
            </ul>
          </aside>
        </div>
        <div className="container-m mt-12">
          <Link href={`/servicios/${next.slug}`} className="group flex items-center justify-between rounded-2xl border border-border p-6 hover:border-sky/40" data-testid="link-next-service">
            <span><span className="block text-xs text-slate-text">{t('Siguiente servicio', 'Next service')}</span><span className="text-lg font-bold text-navy group-hover:text-sky">{next.title[lang]}</span></span>
            <ArrowRight className="h-5 w-5 text-sky transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

/* ---------- ABOUT ---------- */
export function AboutPage() {
  const { t } = useLang();
  const copy = useHeroCopy();
  return (
    <>
      <Seo title={t('Quiénes somos', 'About us')} description={copy.aboutDesc} />
      <PageHero eyebrow={t('Quiénes somos', 'About us')} title={copy.aboutTitle} intro={t('Agencia de investigación de mercados con base en Chihuahua y 15 años de experiencia ayudando a marcas y empresas a decidir con información confiable.', 'A market research agency based in Chihuahua with 15 years of experience helping brands and companies decide with reliable information.')} />
      <section className="py-16 md:py-24">
        <div className="container-m grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal><AboutMedia /></Reveal>
          <Reveal delay={100}>
            <p className="eyebrow mb-4">{t('Sobre nosotros', 'About us')}</p>
            <p className="text-lg leading-relaxed text-slate-text">{copy.aboutDesc}</p>
            <AboutStats />
          </Reveal>
        </div>
      </section>
      <section className="bg-mist/70 py-16 md:py-24">
        <div className="container-m grid gap-6 md:grid-cols-3">
          {[
            [t('Conocimiento local', 'Local knowledge'), t('Entendemos la dinámica social y comercial de Chihuahua y del norte del país desde dentro.', 'We understand the social and commercial dynamics of Chihuahua and northern Mexico from within.')],
            [t('Rigor metodológico', 'Methodological rigor'), t('Elegimos la metodología y la muestra adecuadas para cada pregunta de negocio.', 'We choose the right methodology and sample for every business question.')],
            [t('Insights accionables', 'Actionable insights'), t('Entregamos resultados claros y recomendaciones que se pueden llevar a la práctica.', 'We deliver clear results and recommendations you can put into practice.')],
          ].map(([h, d], i) => (
            <Reveal key={h} delay={i * 80} className="rounded-2xl border border-border bg-card p-7">
              <span className="font-mono text-xs text-sky">0{i + 1}</span>
              <h2 className="mt-3 text-xl font-bold text-navy">{h}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-text">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container-m grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">{t('Cobertura', 'Coverage')}</p>
            <h2 className="text-3xl font-bold text-navy md:text-4xl">{t('Presencia local, alcance nacional', 'Local presence, national reach')}</h2>
            <p className="mt-5 leading-relaxed text-slate-text">{t('Desde Chihuahua atendemos proyectos en las principales ciudades del país y acompañamos a empresas con operación en Estados Unidos.', 'From Chihuahua we serve projects in the main cities of the country and support companies operating in the United States.')}</p>
          </div>
          <CoverageMap />
        </div>
      </section>
      <ClientLogos />
      <CtaBand />
    </>
  );
}

/* ---------- INSIGHTS ---------- */
export function InsightsPage() {
  const { t, lang } = useLang();
  const { site, isLoading, isError, refetch } = useSite();
  const [cat, setCat] = useState<'all' | 'articulo' | 'reporte' | 'caso'>('all');
  const items = useMemo(() => (site?.insights ?? []).filter((i) => i.published && (cat === 'all' || i.category === cat)), [site, cat]);
  return (
    <>
      <Seo title="Insights" description={t('Artículos, reportes y casos de éxito de Monitor sobre tendencias del consumidor y del mercado.', 'Articles, reports and case studies from Monitor on consumer and market trends.')} />
      <PageHero eyebrow="Insights" title={<>{t('Tendencias y perspectivas', 'Trends and perspectives')} <span className="text-sky">{t('del mercado', 'of the market')}</span></>} intro={t('Artículos, reportes y casos de éxito publicados por el equipo de Monitor.', 'Articles, reports and case studies published by the Monitor team.')} />
      <section className="py-14 md:py-20">
        <div className="container-m">
          <div className="mb-10 flex flex-wrap gap-2" role="tablist">
            {(['all', 'articulo', 'reporte', 'caso'] as const).map((c) => (
              <button key={c} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)} data-testid={`tab-insights-${c}`}
                className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition-colors', cat === c ? 'border-navy bg-navy text-white' : 'border-border bg-card text-navy hover:border-sky')}>
                {c === 'all' ? t('Todos', 'All') : CATEGORY_LABEL[c][lang]}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
          ) : isError ? (
            <div className="rounded-2xl border border-border p-10 text-center">
              <p className="font-semibold text-navy">{t('No pudimos cargar las publicaciones.', 'We could not load the publications.')}</p>
              <button type="button" onClick={() => refetch()} className="btn-outline mt-5" data-testid="button-retry">{t('Reintentar', 'Retry')}</button>
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-border bg-mist/60 p-10 text-center" data-testid="empty-insights">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-sky shadow-sm"><FileText className="h-6 w-6" /></span>
              <h2 className="mt-5 text-xl font-bold text-navy">{t('Aún no hay publicaciones', 'No publications yet')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-text">{t('Estamos preparando artículos, reportes y casos de éxito. Mientras tanto, si buscas información sobre tu mercado, platícanos tu proyecto.', 'We are preparing articles, reports and case studies. Meanwhile, if you need information about your market, tell us about your project.')}</p>
              <Link href="/contacto" className="btn-primary mt-6">{t('Contactar a Monitor', 'Contact Monitor')}</Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((p) => <InsightCard key={p.slug} p={p} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}

export function InsightDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLang();
  const { site, isLoading } = useSite();
  if (isLoading) return <div className="container-m py-24"><Skeleton className="h-10 w-2/3" /><Skeleton className="mt-6 h-64 w-full" /></div>;
  const p = site?.insights.find((i) => i.slug === slug && i.published);
  if (!p) return <NotFoundInline />;
  return (
    <>
      <Seo title={p.title} description={p.summary || p.title} image={p.image || undefined} />
      <article>
        <PageHero eyebrow={CATEGORY_LABEL[p.category]?.[lang] ?? 'Insights'} title={p.title} intro={p.summary}>
          <Link href="/insights" className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />{t('Volver a Insights', 'Back to Insights')}</Link>
        </PageHero>
        <div className="container-m max-w-3xl py-14 md:py-20">
          {p.image && <img src={p.image} alt="" className="mb-10 w-full rounded-2xl" />}
          <Body text={p.body} />
          {p.resourceUrl && (
            <a href={p.resourceUrl} target="_blank" rel="noreferrer" className="btn-primary mt-10" data-testid="link-resource">
              {p.category === 'reporte' ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              {p.category === 'reporte' ? t('Descargar reporte', 'Download report') : t('Ver recurso', 'View resource')}
            </a>
          )}
        </div>
      </article>
      <CtaBand />
    </>
  );
}

/* ---------- CONTACT ---------- */
export function ContactPage() {
  const { t, lang } = useLang();
  const { contact } = useSite();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [mode, setMode] = useState<'contacto' | 'cotizacion'>(params.get('modo') === 'cotizacion' ? 'cotizacion' : 'contacto');
  const svc = SERVICES.find((s) => s.slug === params.get('servicio'));
  return (
    <>
      <Seo title={t('Contacto y cotizaciones', 'Contact and quotes')} description={t('Platícanos sobre tu proyecto de investigación de mercados o solicita una cotización. Monitor, Chihuahua.', 'Tell us about your market research project or request a quote. Monitor, Chihuahua.')} />
      <PageHero eyebrow={t('Contacto', 'Contact')} title={<>{t('Platícanos sobre tu', 'Tell us about your')} <span className="text-sky">{t('proyecto', 'project')}</span></>} intro={t('Compártenos tus datos de contacto y una breve explicación de tus necesidades actuales de estudio de mercado. Te responderemos lo antes posible.', 'Share your contact details and a brief explanation of your current market research needs. We will get back to you as soon as possible.')} />
      <section className="py-14 md:py-20">
        <div className="container-m grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-10">
            <div className="mb-8 inline-flex rounded-full bg-mist p-1" role="tablist">
              {([['contacto', t('Contacto', 'Contact')], ['cotizacion', t('Solicitar cotización', 'Request a quote')]] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} data-testid={`tab-mode-${k}`}
                  className={cn('rounded-full px-4 py-2 text-sm font-semibold transition-colors', mode === k ? 'bg-navy text-white shadow' : 'text-navy hover:text-sky')}>{l}</button>
              ))}
            </div>
            <p className="mb-6 text-sm text-slate-text">
              {mode === 'cotizacion' ? t('Describe tu proyecto con el mayor detalle posible para preparar una propuesta.', 'Describe your project in as much detail as possible so we can prepare a proposal.') : t('Escríbenos cualquier pregunta sobre nuestros servicios.', 'Write to us with any question about our services.')}
            </p>
            <ContactForm key={mode} kind={mode} defaultService={svc ? svc.title.es : ''} />
            {svc && <p className="mt-4 text-xs text-slate-text">{t('Servicio preseleccionado:', 'Preselected service:')} {svc.title[lang]}</p>}
          </div>
          <aside className="space-y-4">
            <div className="rounded-3xl bg-navy p-7 text-white">
              <h2 className="text-lg font-bold">{t('Datos de contacto', 'Contact details')}</h2>
              <ul className="mt-5 space-y-4 text-sm text-white/80">
                <li><a href={telHref(contact.phone)} className="flex gap-3 hover:text-white" data-testid="link-contact-phone"><Phone className="h-4 w-4 shrink-0 text-sky" />{contact.phone}</a></li>
                <li><a href={`mailto:${contact.email}`} className="flex gap-3 break-all hover:text-white" data-testid="link-contact-email"><Mail className="h-4 w-4 shrink-0 text-sky" />{contact.email}</a></li>
                <li className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-sky" />{contact.address}</li>
                <li><a href={fbHref(contact.facebook)} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-white"><Facebook className="h-4 w-4 shrink-0 text-sky" />{fbLabel(contact.facebook)}</a></li>
              </ul>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`} target="_blank" rel="noreferrer" className="btn-outline w-full justify-center" data-testid="link-map">
              <MapPin className="h-4 w-4" />{t('Ver ubicación en mapa', 'View location on map')}
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}

/* ---------- CMS PAGE ---------- */
export function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { site, isLoading } = useSite();
  const { t } = useLang();
  if (isLoading) return <div className="container-m py-24"><Skeleton className="h-10 w-1/2" /><Skeleton className="mt-6 h-48 w-full" /></div>;
  const p = site?.pages.find((x) => x.slug === slug && x.published);
  if (!p) return <NotFoundInline />;
  return (
    <>
      <Seo title={p.title} description={p.body.slice(0, 155)} image={p.image || undefined} />
      <PageHero eyebrow="Monitor" title={p.title} />
      <div className="container-m max-w-3xl py-14 md:py-20">
        {p.image && <img src={p.image} alt="" className="mb-10 w-full rounded-2xl" />}
        <Body text={p.body} />
        <Link href="/contacto" className="link-arrow mt-10 text-sm">{t('Contáctanos', 'Contact us')}<ChevronRight className="h-4 w-4" /></Link>
      </div>
    </>
  );
}

export { PrivacyPage } from './privacy';

export function NotFoundInline() {
  const { t } = useLang();
  return (
    <section className="container-m flex min-h-[60vh] flex-col items-start justify-center py-24">
      <Seo title={t('Página no encontrada', 'Page not found')} description="404" noindex />
      <p className="font-mono text-sm text-sky">404</p>
      <h1 className="mt-3 text-4xl font-bold text-navy md:text-5xl">{t('Esta página no existe', 'This page does not exist')}</h1>
      <p className="mt-4 max-w-md text-slate-text">{t('Puede que el enlace haya cambiado o que el contenido ya no esté publicado.', 'The link may have changed or the content is no longer published.')}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">{t('Ir al inicio', 'Go home')}</Link>
        <Link href="/contacto" className="btn-outline">{t('Contacto', 'Contact')}</Link>
      </div>
    </section>
  );
}
