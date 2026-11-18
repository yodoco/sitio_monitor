export type Bi = { es: string; en: string };
export type Service = {
  slug: string;
  title: Bi;
  short: Bi;
  intro: Bi;
  deliverables: Bi[];
  useWhen: Bi[];
  method: Bi[];
};

const b = (es: string, en: string): Bi => ({ es, en });

export const SERVICES: Service[] = [
  {
    slug: 'estudio-de-mercado-integral',
    title: b('Estudio de Mercado Integral', 'Comprehensive Market Study'),
    short: b(
      'Visión completa de tu industria, competencia y clientes en un solo proyecto.',
      'A complete view of your industry, competitors and customers in a single project.',
    ),
    intro: b(
      'Reunimos en un solo proyecto el análisis del entorno, la competencia y el cliente. Combinamos fuentes y metodologías para darte una lectura completa del mercado antes de invertir, lanzar o expandirte.',
      'We bring together the analysis of your environment, competition and customers in one project. We combine sources and methods to give you a complete reading of the market before you invest, launch or expand.',
    ),
    deliverables: [
      b('Dimensionamiento y lectura del mercado', 'Market sizing and reading'),
      b('Mapa competitivo y posicionamiento', 'Competitive map and positioning'),
      b('Perfil y necesidades del cliente', 'Customer profile and needs'),
      b('Recomendaciones accionables', 'Actionable recommendations'),
    ],
    useWhen: [
      b('Vas a abrir una nueva línea, sucursal o mercado.', 'You are opening a new line, branch or market.'),
      b('Necesitas un diagnóstico antes de un plan comercial.', 'You need a diagnosis before a commercial plan.'),
      b('Quieres entender por qué cambió tu participación.', 'You want to understand why your share changed.'),
    ],
    method: [
      b('Investigación documental y de fuentes secundarias', 'Desk research and secondary sources'),
      b('Fases cuantitativas y cualitativas combinadas', 'Combined quantitative and qualitative phases'),
      b('Análisis integrado y sesión de resultados', 'Integrated analysis and results session'),
    ],
  },
  {
    slug: 'estudios-cuantitativos',
    title: b('Estudios Cuantitativos', 'Quantitative Studies'),
    short: b('Datos medibles y estadísticamente representativos para decidir con certeza.', 'Measurable, statistically representative data to decide with certainty.'),
    intro: b(
      'Medimos actitudes, hábitos, intención de compra y satisfacción con muestras diseñadas para representar a tu mercado. Resultados que puedes comparar, segmentar y presentar con respaldo.',
      'We measure attitudes, habits, purchase intent and satisfaction with samples designed to represent your market. Results you can compare, segment and present with confidence.',
    ),
    deliverables: [
      b('Diseño muestral y cuestionario', 'Sample design and questionnaire'),
      b('Base de datos validada', 'Validated dataset'),
      b('Tablas, cruces y segmentación', 'Tables, cross-tabs and segmentation'),
      b('Reporte ejecutivo con hallazgos', 'Executive report with findings'),
    ],
    useWhen: [
      b('Necesitas cifras para sustentar una decisión.', 'You need figures to support a decision.'),
      b('Quieres medir satisfacción, NPS o recordación de marca.', 'You want to measure satisfaction, NPS or brand recall.'),
      b('Buscas comparar segmentos o zonas.', 'You want to compare segments or areas.'),
    ],
    method: [
      b('Encuestas cara a cara, telefónicas o en línea', 'Face-to-face, phone or online surveys'),
      b('Muestreo probabilístico o por cuotas', 'Probability or quota sampling'),
      b('Procesamiento y análisis estadístico', 'Statistical processing and analysis'),
    ],
  },
  {
    slug: 'estudios-cualitativos',
    title: b('Estudios Cualitativos', 'Qualitative Studies'),
    short: b('Motivaciones, percepciones y razones detrás del comportamiento del consumidor.', 'Motivations, perceptions and reasons behind consumer behavior.'),
    intro: b(
      'Exploramos el porqué. Escuchamos a tus clientes y prospectos para entender lo que valoran, lo que les frena y el lenguaje con el que describen tu categoría.',
      'We explore the why. We listen to your customers and prospects to understand what they value, what holds them back and the language they use to describe your category.',
    ),
    deliverables: [
      b('Guía de exploración a la medida', 'Tailored discussion guide'),
      b('Hallazgos e insights por tema', 'Findings and insights by theme'),
      b('Citas y evidencia del consumidor', 'Consumer quotes and evidence'),
      b('Implicaciones para marca y producto', 'Implications for brand and product'),
    ],
    useWhen: [
      b('Estás desarrollando un concepto o producto.', 'You are developing a concept or product.'),
      b('Quieres entender barreras de compra.', 'You want to understand purchase barriers.'),
      b('Necesitas hipótesis antes de cuantificar.', 'You need hypotheses before quantifying.'),
    ],
    method: [
      b('Focus groups y entrevistas a profundidad', 'Focus groups and in-depth interviews'),
      b('Técnicas proyectivas y de exploración', 'Projective and exploratory techniques'),
      b('Análisis temático del discurso', 'Thematic discourse analysis'),
    ],
  },
  {
    slug: 'levantamiento-de-campo',
    title: b('Levantamiento de Campo', 'Fieldwork'),
    short: b('Operación de campo propia: encuestas y recolección de datos confiable.', 'In-house field operation: surveys and reliable data collection.'),
    intro: b(
      'Operamos el campo con equipo propio y supervisión directa. Levantamos encuestas en hogares, calle, puntos de venta y empresas, cuidando la calidad de cada registro.',
      'We run fieldwork with our own team and direct supervision. We collect surveys in homes, streets, points of sale and businesses, ensuring the quality of every record.',
    ),
    deliverables: [
      b('Planeación logística y rutas', 'Logistics and route planning'),
      b('Levantamiento supervisado', 'Supervised data collection'),
      b('Control de calidad y validación', 'Quality control and validation'),
      b('Entrega de base de datos limpia', 'Clean dataset delivery'),
    ],
    useWhen: [
      b('Ya tienes cuestionario y necesitas operación confiable.', 'You have a questionnaire and need reliable operations.'),
      b('Requieres cobertura en varias ciudades.', 'You require coverage across several cities.'),
      b('Tu proyecto exige trabajo presencial.', 'Your project requires in-person work.'),
    ],
    method: [
      b('Encuestadores capacitados por proyecto', 'Interviewers trained per project'),
      b('Supervisión en campo y verificación', 'Field supervision and verification'),
      b('Captura digital y respaldo', 'Digital capture and backup'),
    ],
  },
  {
    slug: 'mineria-de-datos',
    title: b('Minería de Datos', 'Data Mining'),
    short: b('Descubrimos patrones y oportunidades ocultas en tu información.', 'We uncover hidden patterns and opportunities in your information.'),
    intro: b(
      'Convertimos los datos que ya tienes —ventas, clientes, encuestas— en patrones, segmentos y oportunidades que no son evidentes a simple vista.',
      'We turn the data you already have—sales, customers, surveys—into patterns, segments and opportunities that are not visible at first glance.',
    ),
    deliverables: [
      b('Limpieza e integración de fuentes', 'Source cleaning and integration'),
      b('Segmentación y perfiles', 'Segmentation and profiles'),
      b('Hallazgos y patrones relevantes', 'Relevant findings and patterns'),
      b('Visualizaciones para decidir', 'Decision-ready visualizations'),
    ],
    useWhen: [
      b('Tienes datos acumulados que no estás aprovechando.', 'You have accumulated data you are not using.'),
      b('Quieres segmentar a tus clientes.', 'You want to segment your customers.'),
      b('Buscas detectar tendencias en tus ventas.', 'You want to detect trends in your sales.'),
    ],
    method: [
      b('Auditoría y preparación de datos', 'Data audit and preparation'),
      b('Análisis exploratorio y estadístico', 'Exploratory and statistical analysis'),
      b('Interpretación orientada al negocio', 'Business-oriented interpretation'),
    ],
  },
  {
    slug: 'focus-groups',
    title: b('Focus Groups', 'Focus Groups'),
    short: b('Sesiones de grupo moderadas para explorar ideas, productos y marca.', 'Moderated group sessions to explore ideas, products and brand.'),
    intro: b(
      'Reunimos a perfiles específicos de tu mercado en sesiones moderadas para conversar sobre tu marca, conceptos, empaques o comunicación, y observar cómo reaccionan.',
      'We gather specific profiles from your market in moderated sessions to discuss your brand, concepts, packaging or communication, and observe how they react.',
    ),
    deliverables: [
      b('Reclutamiento con filtro de perfil', 'Profile-screened recruitment'),
      b('Moderación profesional', 'Professional moderation'),
      b('Grabación de sesiones', 'Session recordings'),
      b('Reporte de hallazgos', 'Findings report'),
    ],
    useWhen: [
      b('Quieres probar un concepto o campaña.', 'You want to test a concept or campaign.'),
      b('Necesitas escuchar a tu consumidor en sus palabras.', 'You need to hear your consumer in their own words.'),
      b('Comparas alternativas de producto o empaque.', 'You are comparing product or packaging options.'),
    ],
    method: [
      b('Guía de discusión acordada contigo', 'Discussion guide agreed with you'),
      b('Sesiones de 6 a 10 participantes', 'Sessions of 6 to 10 participants'),
      b('Análisis transversal entre grupos', 'Cross-group analysis'),
    ],
  },
  {
    slug: 'entrevistas-a-profundidad',
    title: b('Entrevistas a Profundidad', 'In-Depth Interviews'),
    short: b('Conversaciones uno a uno para obtener insights de alto valor.', 'One-on-one conversations to obtain high-value insights.'),
    intro: b(
      'Conversaciones individuales con clientes, tomadores de decisión o expertos. Ideales para temas sensibles, mercados B2B o perfiles difíciles de reunir en grupo.',
      'Individual conversations with customers, decision makers or experts. Ideal for sensitive topics, B2B markets or profiles that are hard to gather in a group.',
    ),
    deliverables: [
      b('Selección y agenda de entrevistados', 'Interviewee selection and scheduling'),
      b('Entrevistas presenciales o remotas', 'In-person or remote interviews'),
      b('Transcripción y análisis', 'Transcription and analysis'),
      b('Insights y recomendaciones', 'Insights and recommendations'),
    ],
    useWhen: [
      b('Tu mercado es B2B o especializado.', 'Your market is B2B or specialized.'),
      b('El tema requiere confidencialidad.', 'The topic requires confidentiality.'),
      b('Necesitas profundidad más que volumen.', 'You need depth rather than volume.'),
    ],
    method: [
      b('Guía semiestructurada', 'Semi-structured guide'),
      b('Entrevistador senior', 'Senior interviewer'),
      b('Análisis por caso y transversal', 'Case-level and cross-case analysis'),
    ],
  },
  {
    slug: 'mystery-shopper',
    title: b('Mystery Shopper', 'Mystery Shopper'),
    short: b('Evaluamos la experiencia real de compra y servicio en tus puntos de venta.', 'We evaluate the real purchase and service experience at your points of sale.'),
    intro: b(
      'Evaluadores capacitados viven la experiencia como un cliente más y documentan atención, procesos, imagen y cumplimiento de protocolos en tus sucursales.',
      'Trained evaluators live the experience as any other customer and document service, processes, image and protocol compliance at your locations.',
    ),
    deliverables: [
      b('Protocolo de evaluación a la medida', 'Tailored evaluation protocol'),
      b('Visitas y evidencia documentada', 'Visits with documented evidence'),
      b('Calificación por sucursal y rubro', 'Scores by location and category'),
      b('Áreas de mejora priorizadas', 'Prioritized improvement areas'),
    ],
    useWhen: [
      b('Quieres medir el servicio real en sucursal.', 'You want to measure actual in-store service.'),
      b('Necesitas verificar protocolos o promociones.', 'You need to verify protocols or promotions.'),
      b('Comparas tu experiencia con la competencia.', 'You compare your experience with competitors.'),
    ],
    method: [
      b('Escenarios y perfiles de comprador', 'Shopper scenarios and profiles'),
      b('Visitas presenciales o telefónicas', 'In-person or phone visits'),
      b('Reporte por punto de venta', 'Report per point of sale'),
    ],
  },
];

export const STEPS = [
  { t: b('Entendemos tu reto', 'We understand your challenge'), d: b('Definimos contigo los objetivos y las decisiones que quieres tomar.', 'We define with you the objectives and the decisions you want to make.') },
  { t: b('Diseñamos el estudio', 'We design the study'), d: b('Elegimos la metodología y la muestra adecuadas para tu mercado.', 'We choose the right methodology and sample for your market.') },
  { t: b('Levantamos la información', 'We collect the information'), d: b('Trabajo de campo, grupos, entrevistas o minería de datos.', 'Fieldwork, groups, interviews or data mining.') },
  { t: b('Entregamos insights', 'We deliver insights'), d: b('Resultados claros y recomendaciones accionables para tu negocio.', 'Clear results and actionable recommendations for your business.') },
];

export const DEFAULT_CONTACT = {
  phone: '(614) 251-28-16',
  address: 'Calle Aldama 1306, Interior 20, Chihuahua, Chih. México',
  email: 'holamonitor@gmail.com',
  facebook: 'https://facebook.com/InteligenciaMonitor',
};

export const CATEGORY_LABEL: Record<string, Bi> = {
  articulo: b('Artículo', 'Article'),
  reporte: b('Reporte', 'Report'),
  caso: b('Caso de éxito', 'Case study'),
};
