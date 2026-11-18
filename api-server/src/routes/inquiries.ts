import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { db, inquiries } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitInquiryBody, SubmitInquiryResponse, ListInquiriesResponse, UpdateInquiryBody, UpdateInquiryParams, UpdateInquiryResponse, DeleteInquiryParams } from "@workspace/api-zod";
import { requireAdmin, sameOrigin } from "../middlewares/admin";
import { notifyInquiry } from "../lib/email";

const router: IRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Has enviado varias solicitudes. Intenta de nuevo en 15 minutos o llámanos." } });
router.post("/inquiries", sameOrigin, limiter, async (req, res) => {
  const parsed = SubmitInquiryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Revisa tu nombre, correo y mensaje (mínimo 10 caracteres)." }); return; }
  const { website: _, ...data } = parsed.data;
  const [inquiry] = await db.insert(inquiries).values({ ...data, name: data.name.trim(), email: data.email.trim().toLowerCase() }).returning();
  let emailSent = false;
  try {
    emailSent = await notifyInquiry(inquiry);
    if (emailSent) await db.update(inquiries).set({ emailSent: true }).where(eq(inquiries.id, inquiry.id));
  } catch {
    req.log.warn({ inquiryId: inquiry.id }, "Inquiry saved; email notification was not accepted");
  }
  res.status(201).json(SubmitInquiryResponse.parse({
    id: inquiry.id, emailSent,
    message: emailSent
      ? "Tu solicitud quedó registrada y la notificación fue aceptada por el servicio de correo. Gracias por contactar a MONITOR."
      : "Tu solicitud quedó guardada para el equipo de MONITOR. La notificación por correo no se envió; también puedes contactarnos por teléfono.",
  }));
});
router.get("/admin/inquiries", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  res.json(ListInquiriesResponse.parse(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }))));
});
router.patch("/admin/inquiries/:id", sameOrigin, requireAdmin, async (req, res) => {
  const params = UpdateInquiryParams.safeParse(req.params);
  const body = UpdateInquiryBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Solicitud inválida." }); return; }
  const [row] = await db.update(inquiries).set(body.data).where(eq(inquiries.id, params.data.id)).returning();
  if (!row) { res.status(404).json({ error: "Solicitud no encontrada." }); return; }
  res.json(UpdateInquiryResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});
router.delete("/admin/inquiries/:id", sameOrigin, requireAdmin, async (req, res) => {
  const params = DeleteInquiryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Solicitud inválida." }); return; }
  const rows = await db.delete(inquiries).where(eq(inquiries.id, params.data.id)).returning({ id: inquiries.id });
  if (!rows.length) { res.status(404).json({ error: "Solicitud no encontrada." }); return; }
  res.status(204).end();
});
export default router;
