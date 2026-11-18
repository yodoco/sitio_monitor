import { Router, type IRouter } from "express";
import { db, siteSettings } from "@workspace/db";
import { SaveSiteBody, GetSiteResponse } from "@workspace/api-zod";
import { adminIdentity, requireAdmin, sameOrigin } from "../middlewares/admin";
import { readSite, safeUrl } from "../lib/site";
const router: IRouter = Router();

router.get("/site", async (req, res) => {
  const content = await readSite();
  const admin = await adminIdentity(req);
  res.set("Cache-Control", "no-store");
  res.json(GetSiteResponse.parse(admin ? content : {
    ...content,
    pages: content.pages.filter(p => p.published),
    insights: content.insights.filter(p => p.published),
  }));
});
router.put("/admin/site", sameOrigin, requireAdmin, async (req, res) => {
  const result = SaveSiteBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Revisa los campos, títulos y enlaces del contenido." }); return; }
  const content = result.data;
  const urls = [content.aboutImage, content.videoUrl, content.facebook, ...content.pages.map(p => p.image), ...content.insights.flatMap(p => [p.image, p.resourceUrl])];
  if (urls.some(url => !safeUrl(url))) { res.status(400).json({ error: "Usa enlaces HTTPS o rutas locales válidas, sin scripts." }); return; }
  if (new Set(content.pages.map(p => p.slug)).size !== content.pages.length || new Set(content.insights.map(p => p.slug)).size !== content.insights.length) {
    res.status(400).json({ error: "Cada página o publicación debe tener una dirección única." }); return;
  }
  await db.insert(siteSettings).values({ id: 1, content }).onConflictDoUpdate({
    target: siteSettings.id, set: { content, updatedAt: new Date() },
  });
  res.json(GetSiteResponse.parse(content));
});
export default router;
