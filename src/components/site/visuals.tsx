import { useLang } from '@/lib/i18n';
import geography from '@/lib/mexico-geography.json';

export function IllustrativePanel() {
  const { t } = useLang();
  const bars = [34, 46, 41, 61, 54, 76, 91];
  return (
    <figure className="relative" aria-label={t('Panel ilustrativo, cifras de maqueta', 'Illustrative panel, mock-up figures')}>
      <span className="absolute -top-3 -right-3 z-10 rounded-full bg-white px-3 py-1.5 text-[0.68rem] font-medium text-navy shadow-sm" data-testid="text-illustrative">
        {t('Cifras ilustrativas (maqueta)', 'Illustrative figures (mock-up)')}
      </span>
      <div className="rounded-2xl bg-white/[0.97] p-5 text-ink shadow-2xl md:p-6">
        <div className="flex items-center justify-between">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-text">{t('Panel de insights', 'Insights panel')}</span>
          <span className="font-mono text-[0.7rem] text-slate-text">2026</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            ['72%', t('Intención de compra', 'Purchase intent')],
            ['+18', t('Pts. NPS', 'NPS pts.')],
            ['1,200', t('Encuestas', 'Surveys')],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-mist p-3">
              <div className="text-xl font-bold text-navy md:text-2xl">{v}</div>
              <div className="mt-0.5 text-[0.66rem] leading-tight text-slate-text">{l}</div>
            </div>
          ))}
        </div>
        <svg viewBox="0 0 240 90" className="mt-4 h-28 w-full" role="img" aria-label={t('Gráfica ilustrativa', 'Illustrative chart')}>
          {bars.map((h, i) => (
            <rect key={i} className="bar" style={{ animationDelay: `${300 + i * 60}ms` }} x={i * 34 + 2} y={90 - h * 0.9} width="28" height={h * 0.9} rx="2.5"
              fill="#3DB5E6" />
          ))}
        </svg>
        <figcaption className="absolute -bottom-3 -left-3 rounded-full bg-white px-3 py-1.5 text-[0.65rem] text-navy shadow-sm">
          {t('Tendencias del mercado en tiempo real', 'Real-time market trends')}
        </figcaption>
      </div>
    </figure>
  );
}

const CITIES = [
  { n: 'San Diego, CA', x: 42.6, y: 41.3, dx: 10, dy: -15, active: true },
  { n: 'Tijuana', x: 44.4, y: 44.8, dx: 10, dy: 23, active: false },
  { n: 'El Paso, TX', x: 202.7, y: 58.2, dx: 10, dy: -9, active: true },
  { n: 'Chihuahua', x: 209, y: 112.5, dx: 10, dy: 4, active: true },
  { n: 'Monterrey', x: 295.3, y: 162.2, dx: 10, dy: 4, active: false },
  { n: 'CDMX', x: 313, y: 263.8, dx: 10, dy: -8, active: false },
];

export function CoverageMap() {
  const { t } = useLang();
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-navy p-4 md:p-6" aria-label={t('Cobertura en México, San Diego y El Paso', 'Coverage in Mexico, San Diego and El Paso')}>
      <svg viewBox="0 0 530 365" className="relative w-full overflow-hidden" role="img" aria-label={t('Mapa geográfico de México y sur de Estados Unidos', 'Geographic map of Mexico and the southern United States')}>
        <path d={geography.paths.USA} fill="#103348" stroke="#638397" strokeWidth="0.6" />
        <path d={geography.paths.MEX} fill="#16587F" stroke="#3DB5E6" strokeWidth="0.8" strokeLinejoin="round" />
        {CITIES.map((c) => (
          <g key={c.n}>
            {c.active && <circle className="pulse-dot" cx={c.x} cy={c.y} r="9" fill="#3DB5E6" opacity=".35" />}
            <circle cx={c.x} cy={c.y} r={c.active ? 3.5 : 2.5} fill={c.active ? '#3DB5E6' : 'white'} />
            <text x={c.x + c.dx} y={c.y + c.dy} fontSize="12" fontWeight="500" fill="white" fontFamily="Poppins, sans-serif" stroke="#0B2A3F" strokeWidth="2.5" paintOrder="stroke">{c.n}</text>
          </g>
        ))}
      </svg>
      <figcaption className="text-right text-[9px] text-white/60">Natural Earth</figcaption>
    </figure>
  );
}
