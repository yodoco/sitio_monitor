import { Router, type IRouter } from "express";
import { readSite } from "../lib/site";
const router: IRouter = Router();
const xmlEscape = (s: string) => s.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!));
router.get("/sitemap.xml", async (_req, res) => {
  const configured = process.env.SITE_URL;
  if (!configured) {
    res.status(503).type("text/plain").send("Sitemap pendiente: configura SITE_URL con el dominio publicado de MONITOR.");
    return;
  }
  let origin: string;
  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:") throw new Error("Invalid site URL");
    origin = parsed.origin;
  } catch {
    res.status(503).type("text/plain").send("SITE_URL debe ser una dirección HTTPS válida."); return;
  }
  const content = await readSite();
  const services = ["estudio-de-mercado-integral", "estudios-cuantitativos", "estudios-cualitativos", "levantamiento-de-campo", "mineria-de-datos", "focus-groups", "entrevistas-a-profundidad", "mystery-shopper"];
  const paths = ["/", "/servicios", "/quienes-somos", "/insights", "/contacto", "/aviso-de-privacidad",
    ...services.map(slug => `/servicios/${slug}`),
    ...content.pages.filter(p => p.published).map(p => `/paginas/${p.slug}`),
    ...content.insights.filter(p => p.published).map(p => `/insights/${p.slug}`),
  ];
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${xmlEscape(origin + p)}</loc></url>`).join("")}</urlset>`);
});
export default router;
