import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../dist/server/entry-server.js';

const origin = 'https://www.monitormkt.com';
const published = { slug: 'articulo-de-prueba', title: 'Artículo de prueba', summary: 'Resumen específico del artículo', body: 'Contenido publicado visible sin JavaScript.', published: true, category: 'articulo' };
const site = {
  heroTitle: '', heroDescription: '', aboutTitle: '', aboutDescription: '',
  aboutImage: '', videoUrl: '', phone: '', address: '', email: '', facebook: '',
  pages: [],
  insights: [published, { ...published, slug: 'borrador', title: 'BORRADOR PRIVADO', published: false }],
};
const paths = [
  '/', '/servicios', '/quienes-somos', '/insights', '/contacto', '/aviso-de-privacidad',
  ...['estudio-de-mercado-integral', 'estudios-cuantitativos', 'estudios-cualitativos',
    'levantamiento-de-campo', 'mineria-de-datos', 'focus-groups', 'entrevistas-a-profundidad',
    'mystery-shopper'].map(slug => `/servicios/${slug}`),
  '/insights/articulo-de-prueba',
];
test('all public pages have complete HTML and unique per-page metadata', () => {
  const titles = new Set();
  for (const route of paths) {
    const result = render(route, site, origin);
    assert.equal(result.status, 200, route);
    assert.match(result.html, /<h1[\s>]/, route);
    assert.match(result.html, /<main[\s>]/, route);
    assert.ok(result.head.includes(`rel="canonical" href="${origin}${route}"`), route);
    for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
      assert.ok(result.head.includes(`property="${property}"`), route);
    }
    const title = result.head.match(/<title>(.*?)<\/title>/)[1];
    assert.ok(!titles.has(title), route);
    titles.add(title);
    assert.ok(!result.data.includes('BORRADOR PRIVADO'));
  }
});
test('Focus Groups copy and published article body are rendered without JavaScript', () => {
  assert.match(render('/servicios/focus-groups', site, origin).html, /Reunimos a perfiles específicos/);
  const article = render('/insights/articulo-de-prueba', site, origin);
  assert.match(article.html, /Contenido publicado visible sin JavaScript/);
  assert.match(article.head, /og:type" content="article"/);
});
test('unknown services, unpublished articles, and missing routes are 404 and noindex', () => {
  for (const route of ['/no-existe', '/servicios/no-existe', '/insights/borrador', '/insights/no-existe']) {
    const result = render(route, site, origin);
    assert.equal(result.status, 404);
    assert.match(result.head, /noindex, nofollow/);
    assert.ok(!result.html.includes('BORRADOR PRIVADO'));
  }
});
test('serialized CMS data cannot close its JSON script element', () => {
  const result = render('/', { ...site, heroTitle: '</script><script>alert(1)</script>' }, origin);
  assert.ok(!result.data.includes('</script>'));
  assert.ok(result.data.includes('\\u003c/script>'));
  assert.equal(JSON.parse(result.data).heroTitle, '</script><script>alert(1)</script>');
});
