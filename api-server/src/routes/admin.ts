import { Router, type IRouter } from "express";
import { db, adminAccess, inquiries } from "@workspace/db";
import { sql } from "drizzle-orm";
import { GetAdminSessionResponse, SaveAdminAccessBody, GetAdminAccessResponse, GetAdminSummaryResponse } from "@workspace/api-zod";
import { requireAdmin, sameOrigin } from "../middlewares/admin";
import { readAdminEmails } from "../lib/site";
import { emailStatus } from "../lib/email";
const router: IRouter = Router();

router.get("/admin/session", requireAdmin, (_req, res) => {
  res.json(GetAdminSessionResponse.parse({ email: res.locals.admin.email, isAdmin: true }));
});
router.get("/admin/access", requireAdmin, async (_req, res) => {
  res.json(GetAdminAccessResponse.parse({ emails: await readAdminEmails() }));
});
router.put("/admin/access", sameOrigin, requireAdmin, async (req, res) => {
  const result = SaveAdminAccessBody.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: "Indica uno o dos correos válidos." }); return; }
  const emails = [...new Set(result.data.emails.map(e => e.trim().toLowerCase()))];
  if (!emails.includes(res.locals.admin.email)) {
    res.status(400).json({ error: "Conserva tu propio acceso para no bloquear la administración." }); return;
  }
  await db.insert(adminAccess).values({ id: 1, emails }).onConflictDoUpdate({ target: adminAccess.id, set: { emails } });
  res.json(GetAdminAccessResponse.parse({ emails }));
});
router.get("/admin/summary", requireAdmin, async (_req, res) => {
  const [counts] = await db.select({
    total: sql<number>`count(*)::int`,
    newCount: sql<number>`count(*) filter (where ${inquiries.status} = 'nuevo')::int`,
    quotes: sql<number>`count(*) filter (where ${inquiries.kind} = 'cotizacion')::int`,
  }).from(inquiries);
  res.json(GetAdminSummaryResponse.parse({ ...counts, ...emailStatus() }));
});
export default router;
