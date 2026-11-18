import { useLang } from '@/lib/i18n';
import { PageHero } from '@/components/site/shared';
import { Seo } from '@/components/site/seo';

type Block = { h?: string; p?: string[]; list?: string[]; after?: string };

const PRIVACY: Block[] = [
  { p: ['Monitor Inteligencia de Mercados (en adelante, “Monitor”), con domicilio conocido en Chihuahua, Chih., México, es responsable del tratamiento de sus datos personales conforme a la legislación mexicana aplicable en materia de protección de datos personales.'] },
  { h: '1. Datos personales que recabamos', p: ['Recabamos datos de identificación y contacto (nombre, empresa, correo electrónico, teléfono), datos fiscales y de facturación, y, en el caso de participantes en estudios, las respuestas que usted proporcione en encuestas, entrevistas o grupos de enfoque. No recabamos datos personales sensibles.'] },
  {
    h: '2. Finalidades del tratamiento',
    p: ['Utilizamos sus datos para:'],
    list: [
      'Prestar servicios de investigación de mercados, consultoría, encuestas y análisis de datos.',
      'Dar de alta clientes, facturar, cobrar y dar seguimiento a los proyectos contratados.',
      'Enviar cotizaciones, actualizaciones del servicio y comunicaciones relacionadas.',
    ],
    after: 'Los datos obtenidos de participantes en estudios se procesan de forma agregada y estadística, garantizando su anonimato acorde a las especificaciones del servicio.',
  },
  { h: '3. Transferencia de datos', p: ['Sus datos no se comparten con terceros, salvo cuando sea necesario para cumplir obligaciones legales ante autoridades competentes, o para ejecutar contratos o servicios entre México y Estados Unidos que usted haya autorizado.'] },
  { h: '4. Derechos ARCO y revocación del consentimiento', p: ['Usted puede solicitar el acceso a sus datos, su rectificación o cancelación, y oponerse a su uso, así como revocar su consentimiento. Para ello, envíe su solicitud a holamonitor@gmail.com o preséntela en nuestras oficinas en Chihuahua, Chih. Responderemos en los plazos que marca la ley.'] },
  { h: '5. Cambios al aviso', p: ['Este aviso puede modificarse por nuevos requerimientos legales o cambios en nuestras prácticas. Publicaremos cualquier actualización en www.monitormkt.com.'] },
];

export function PrivacyPage() {
  const { t } = useLang();
  return (
    <>
      <Seo title={t('Aviso de privacidad', 'Privacy notice')} description="Aviso de privacidad de Monitor Inteligencia de Mercados." />
      <PageHero eyebrow="Legal" title="Aviso de privacidad" />
      <article className="container-m max-w-3xl py-14 md:py-20" data-testid="text-privacy" lang="es">
        <div className="space-y-8 text-base leading-[1.8] text-slate-text">
          {PRIVACY.map((b, i) => (
            <section key={i}>
              {b.h && <h2 className="mb-3 text-xl font-semibold text-navy">{b.h}</h2>}
              {b.p?.map((x) => <p key={x}>{x}</p>)}
              {b.list && <ul className="mt-3 list-disc space-y-1.5 pl-6">{b.list.map((x) => <li key={x}>{x}</li>)}</ul>}
              {b.after && <p className="mt-3">{b.after}</p>}
            </section>
          ))}
          <p className="border-t border-border pt-6 text-sm font-medium text-navy">Última actualización: octubre de 2026.</p>
        </div>
      </article>
    </>
  );
}
