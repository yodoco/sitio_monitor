import type { Insight } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowRight, ChevronRight, FileText } from 'lucide-react';
import { CATEGORY_LABEL, SERVICES, STEPS } from '@/lib/content';
import { useLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ClientLogos, Reveal, SectionHead, useSite } from '@/components/site/shared';
import { ContactForm } from '@/components/site/contact-form';
import { CoverageMap, IllustrativePanel } from '@/components/site/visuals';
import { AboutMedia, ServiceIcon } from '@/components/site/media';
import { Seo } from '@/components/site/seo';

export const DEFAULT_HERO_TITLE = 'Toma las decisiones de negocio correctas.';
export const DEFAULT_HERO_DESC = 'Somos una agencia de investigación de mercados con 15 años de experiencia. Te ayudamos a conocer a tu mercado, sus oportunidades y su potencial con insights certeros y oportunos.';
export const DEFAULT_ABOUT_TITLE = 'Un profundo conocimiento de la dinámica social de México.';
export const DEFAULT_ABOUT_DESC = 'Basados en Chihuahua, ayudamos a marcas y empresas a conocer a su mercado, sus oportunidades y potencial. Analizamos factores del entorno y tendencias para brindar, de manera certera y oportuna, los insights más valiosos para la toma de decisiones de negocio.';

export function useHeroCopy() {
  const { lang } = useLang();
  const { site } = useSite();
  const pick = (val: string | undefined, def: string, en: string) => {
    const v = val?.trim() || def;
    return lang === 'en' && v === def ? en : v;
  };
  return {
    heroTitle: pick(site?.heroTitle, DEFAULT_HERO_TITLE, 'Make the right business decisions.'),
    heroDesc: pick(site?.heroDescription, DEFAULT_HERO_DESC, 'We are a market research agency with 15 years of experience. We help you understand your market, its opportunities and its potential with accurate, timely insights.'),
    aboutTitle: pick(site?.aboutTitle, DEFAULT_ABOUT_TITLE, 'A deep understanding of the social dynamics of Mexico.'),
    aboutDesc: pick(site?.aboutDescription, DEFAULT_ABOUT_DESC, 'Based in Chihuahua, we help brands and companies understand their market, its opportunities and potential. We analyze environmental factors and trends to deliver, accurately and on time, the most valuable insights for business decision-making.'),
  };
}

function HeroTitle({ text }: { text: string }) {
  const words = text.trim().split(' ');
  const last = words.pop();
  return <>{words.join(' ')} <span className="text-sky">{last}</span></>;
}

export function AboutStats() {
  const { t } = useLang();
  return (
    <dl className="mt-8 grid grid-cols-3 gap-4">
      {[
        ['15+', t('años de experiencia', 'years of experience')],
        ['8', t('servicios de investigación', 'research services')],
        ['MX-EUA', t('cobertura nacional y presencia en EE. UU.', 'national coverage and presence in the U.S.')],
      ].map(([v, l]) => (
        <div key={v} className="border-t-2 border-sky pt-3">
          <dt className={cn('font-bold text-navy', v === 'MX-EUA' ? 'text-xl md:text-3xl' : 'text-3xl md:text-4xl')}>{v}</dt>
          <dd className="mt-1 text-xs leading-snug text-slate-text md:text-sm">{l}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const { site } = useSite();
  const copy = useHeroCopy();
  const insights = (site?.insights ?? []).filter((i) => i.published).slice(0, 3);

  return (
    <>
      <Seo title={t('Monitor | Investigación de mercados en Chihuahua', 'Monitor | Market research in Chihuahua, Mexico')} description={copy.heroDesc} />

      {/* HERO */}
      <section className="hero-bg relative overflow-hidden text-white">
        <div className="container-m relative grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="eyebrow mb-6">{t('Inteligencia e investigación de mercados', 'Market intelligence and research')}</p>
            <h1 className="text-[2.6rem] font-bold leading-[1.1] sm:text-6xl lg:text-[4rem]" data-testid="text-hero-title">
              <HeroTitle text={copy.heroTitle} />
            </h1>
            <p className="mt-7 max-w-[34rem] text-base leading-relaxed text-white/75 md:text-lg" data-testid="text-hero-description">{copy.heroDesc}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contacto?modo=cotizacion" className="btn-primary" data-testid="link-hero-cta">{t('Trabajemos juntos', "Let's work together")}<ChevronRight className="h-4 w-4" /></Link>
              <Link href="/servicios" className="btn-ghost-light" data-testid="link-hero-services">{t('Conocer servicios', 'Explore services')}</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none"><IllustrativePanel /></div>
        </div>
      </section>

      <ClientLogos />

      {/* ABOUT */}
      <section className="py-20 md:py-28">
        <div className="container-m grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal><AboutMedia /></Reveal>
          <Reveal delay={100}>
            <p className="eyebrow mb-4">{t('Sobre nosotros', 'About us')}</p>
            <h2 className="text-3xl font-bold leading-[1.1] text-navy md:text-[2.6rem]">{copy.aboutTitle}</h2>
            <p className="mt-6 text-base leading-relaxed text-slate-text">{copy.aboutDesc}</p>
            <AboutStats />
            <Link href="/quienes-somos" className="link-arrow mt-8 text-sm" data-testid="link-about-more">{t('Conocer más sobre Monitor', 'Learn more about Monitor')}<ChevronRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-mist/70 py-20 md:py-28" id="servicios">
        <div className="container-m">
          <SectionHead
            eyebrow={t('Servicios', 'Services')}
            title={<>{t('Ocho formas de entender', 'Eight ways to understand')}<br />{t('a tu mercado', 'your market')}</>}
            right={<Link href="/servicios" className="link-arrow text-sm" data-testid="link-all-services">{t('Ver todos los servicios', 'See all services')}<ChevronRight className="h-4 w-4" /></Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.slug} delay={(i % 4) * 60}>
                <Link
                  href={`/servicios/${s.slug}`}
                  data-testid={`card-service-${s.slug}`}
                  className={cn(
                    'group flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                    i === 0 ? 'border-navy bg-navy text-white' : 'border-border bg-card hover:border-sky/40',
                  )}
                >
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', i === 0 ? 'bg-white/10 text-sky' : 'bg-accent text-sky')}>
                    <ServiceIcon slug={s.slug} />
                  </span>
                  <h3 className={cn('mt-5 text-base font-bold leading-snug', i === 0 ? 'text-white' : 'text-navy')}>{s.title[lang]}</h3>
                  <p className={cn('mt-2 flex-1 text-sm leading-relaxed', i === 0 ? 'text-white/70' : 'text-slate-text')}>{s.short[lang]}</p>
                  <span className="link-arrow mt-5">{t('Ver servicio', 'View service')}<ChevronRight className="h-3.5 w-3.5" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-20 md:py-28">
        <div className="container-m">
          <SectionHead eyebrow={t('Cómo trabajamos', 'How we work')} title={<>{t('De tu pregunta de negocio', 'From your business question')}<br />{t('a una decisión informada', 'to an informed decision')}</>} />
          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-6">
            <span className="absolute left-5 right-5 top-5 hidden h-px bg-border md:block" aria-hidden />
            {STEPS.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 90} className="relative">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sky text-sm font-bold text-white ring-8 ring-background">{i + 1}</span>
                <h3 className="mt-5 text-base font-bold text-navy">{s.t[lang]}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-text">{s.d[lang]}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="bg-mist/70 py-20 md:py-28">
        <div className="container-m">
          <SectionHead
            eyebrow="Insights"
            title={<>{t('Tendencias y perspectivas', 'Trends and perspectives')}<br />{t('del mercado', 'of the market')}</>}
            right={<Link href="/insights" className="link-arrow text-sm" data-testid="link-blog">{t('Ir al blog', 'Go to blog')}<ChevronRight className="h-4 w-4" /></Link>}
          />
          {insights.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {insights.map((p, i) => (
                <Reveal key={p.slug} delay={i * 80}>
                  <InsightCard p={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3" data-testid="empty-insights">
              {(['articulo', 'reporte', 'caso'] as const).map((c) => (
                <div key={c} className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-card">
                  <div className="placeholder-hatch flex aspect-[16/9] items-center justify-center"><FileText className="h-7 w-7 text-slate-text/50" /></div>
                  <div className="p-6">
                    <p className="eyebrow !text-[0.66rem]">{CATEGORY_LABEL[c][lang]}</p>
                    <p className="mt-2 text-sm font-semibold text-navy">{t('Próximamente', 'Coming soon')}</p>
                    <p className="mt-1 text-sm text-slate-text">{t('Aún no hay publicaciones en esta categoría.', 'No publications in this category yet.')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COVERAGE */}
      <section className="py-20 md:py-28">
        <div className="container-m grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-4">{t('Cobertura', 'Coverage')}</p>
            <h2 className="text-3xl font-bold leading-[1.1] text-navy md:text-[2.5rem]">{t('Presencia local,', 'Local presence,')}<br />{t('alcance nacional', 'national reach')}</h2>
            <p className="mt-6 max-w-lg leading-relaxed text-slate-text">{t('Desde Chihuahua atendemos proyectos en las principales ciudades del país y acompañamos a empresas con operación en Estados Unidos.', 'From Chihuahua we serve projects in the main cities of the country and support companies operating in the United States.')}</p>
            <ul className="mt-7 flex flex-wrap gap-2">
              {['Chihuahua', t('Ciudad de México', 'Mexico City'), 'Monterrey', 'Tijuana', t('Y más ciudades', 'And more cities'), t('Estados Unidos', 'United States')].map((c, i) => (
                <li key={c} className={cn('rounded-full border px-3.5 py-1.5 text-xs font-semibold', i === 0 ? 'border-sky bg-sky text-white' : 'border-border bg-card text-navy')}>{c}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}><CoverageMap /></Reveal>
        </div>
      </section>

      {/* CONTACT */}
      <section className="pb-20 md:pb-28">
        <div className="container-m">
          <div className="grid gap-10 overflow-hidden rounded-3xl sky-bg p-7 text-white md:p-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/80">{t('Contacto', 'Contact')}</p>
              <h2 className="text-3xl font-bold leading-[1.1] md:text-[2.5rem]">{t('Platícanos sobre tu', 'Tell us about your')}<br />{t('proyecto', 'project')}</h2>
              <p className="mt-6 max-w-md leading-relaxed text-white/85">{t('Compártenos tus datos de contacto y una breve explicación de tus necesidades actuales de estudio de mercado. Te responderemos lo antes posible.', 'Share your contact details and a brief explanation of your current market research needs. We will get back to you as soon as possible.')}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-xl md:p-7">
              <ContactForm compact kind="contacto" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function InsightCard({ p }: { p: Insight }) {
  const { t, lang } = useLang();
  const cta = p.category === 'reporte' ? t('Descargar', 'Download') : p.category === 'caso' ? t('Ver caso', 'View case') : t('Leer más', 'Read more');
  return (
    <Link href={`/insights/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg" data-testid={`card-insight-${p.slug}`}>
      <div className="aspect-[16/9] overflow-hidden bg-mist">
        {p.image ? <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="placeholder-hatch h-full w-full" />}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow !text-[0.66rem]">{CATEGORY_LABEL[p.category]?.[lang] ?? p.category}</p>
        <h3 className="mt-2 text-lg font-bold leading-snug text-navy">{p.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-text">{p.summary}</p>
        <span className="link-arrow mt-5">{cta}<ArrowRight className="h-3.5 w-3.5" /></span>
      </div>
    </Link>
  );
}
