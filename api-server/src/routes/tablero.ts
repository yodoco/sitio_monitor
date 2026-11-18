import express, { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { z } from "zod";
import { clerkClient, getAuth } from "@clerk/express";
import { db, tableroAccess, tableroData } from "@workspace/db";
import { asc, eq } from "drizzle-orm";
import { requireAdmin, sameOrigin } from "../middlewares/admin";
import { readAdminEmails } from "../lib/site";

// Tablero de inteligencia inmobiliaria (/inteligencia-inmobiliaria).
// Los datos viven solo en la base de datos y se entregan a cuentas de Clerk con correo verificado
// que estén autorizadas en el panel (o que sean administradoras). Nunca se publican como archivo estático.
const router: IRouter = Router();
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

async function tableroIdentity(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;
  const user = await clerkClient.users.getUser(userId);
  const verified = user.emailAddresses
    .filter(e => e.verification?.status === "verified")
    .map(e => e.emailAddress.toLowerCase());
  if (!verified.length) return null;
  const admins = await readAdminEmails();
  const admin = verified.find(e => admins.includes(e));
  if (admin) return { email: admin, admin: true };
  const rows = await db.select({ email: tableroAccess.email }).from(tableroAccess);
  const allowed = new Set(rows.map(r => r.email));
  const email = verified.find(e => allowed.has(e));
  return email ? { email, admin: false } : null;
}

async function requireTablero(req: Request, res: Response, next: NextFunction) {
  res.set("Cache-Control", "no-store");
  if (!getAuth(req).userId) { res.status(401).json({ error: "Inicia sesión para continuar." }); return; }
  const identity = await tableroIdentity(req);
  if (!identity) { res.status(403).json({ error: "Esta cuenta no tiene acceso al tablero. Usa un correo autorizado y verificado." }); return; }
  res.locals.tablero = identity;
  next();
}

async function dataMeta() {
  const [row] = await db.select({
    cutoff: tableroData.cutoff, bytes: tableroData.bytes, updatedAt: tableroData.updatedAt, updatedBy: tableroData.updatedBy,
  }).from(tableroData).where(eq(tableroData.id, 1));
  return row ? { ...row, updatedAt: row.updatedAt.toISOString() } : null;
}

router.get("/tablero/session", requireTablero, async (_req, res) => {
  const meta = await dataMeta();
  res.json({ email: res.locals.tablero.email, admin: res.locals.tablero.admin, cutoff: meta?.cutoff ?? null });
});

// Se guarda en memoria la versión comprimida mientras no cambien los datos.
let cache: { key: string; raw: Buffer; gz: Buffer; etag: string } | null = null;
router.get("/tablero/data", requireTablero, async (req, res) => {
  const [meta] = await db.select({ updatedAt: tableroData.updatedAt }).from(tableroData).where(eq(tableroData.id, 1));
  if (!meta) { res.status(404).json({ error: "Todavía no hay datos cargados en el tablero." }); return; }
  const key = meta.updatedAt.toISOString();
  if (!cache || cache.key !== key) {
    const [row] = await db.select({ content: tableroData.content }).from(tableroData).where(eq(tableroData.id, 1));
    const raw = Buffer.from(row.content, "utf8");
    cache = { key, raw, gz: gzipSync(raw), etag: `"${createHash("sha256").update(raw).digest("hex").slice(0, 32)}"` };
  }
  res.set({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-cache",
    "ETag": cache.etag,
    "Vary": "Accept-Encoding, Cookie, Authorization",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.get("if-none-match") === cache.etag) { res.status(304).end(); return; }
  if (/\bgzip\b/.test(req.get("accept-encoding") ?? "")) { res.set("Content-Encoding", "gzip"); res.send(cache.gz); return; }
  res.send(cache.raw);
});

// ───────── Administración (panel /ad-min) ─────────
router.get("/admin/tablero", requireAdmin, async (_req, res) => {
  const users = await db.select().from(tableroAccess).orderBy(asc(tableroAccess.createdAt));
  res.json({ users: users.map(u => ({ email: u.email, note: u.note, createdAt: u.createdAt.toISOString() })), data: await dataMeta() });
});

const UsersBody = z.object({
  users: z.array(z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    note: z.string().trim().max(120).default(""),
  })).max(200),
});
router.put("/admin/tablero/users", sameOrigin, requireAdmin, async (req, res) => {
  const parsed = UsersBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Revisa los correos: deben ser válidos y sin repetir (máximo 200)." }); return; }
  const unique = [...new Map(parsed.data.users.map(u => [u.email, u])).values()];
  await db.transaction(async (tx) => {
    await tx.delete(tableroAccess);
    if (unique.length) await tx.insert(tableroAccess).values(unique);
  });
  const users = await db.select().from(tableroAccess).orderBy(asc(tableroAccess.createdAt));
  res.json({ users: users.map(u => ({ email: u.email, note: u.note, createdAt: u.createdAt.toISOString() })), data: await dataMeta() });
});

// El archivo se manda como text/plain para no chocar con el límite de 1 MB de express.json.
router.put("/admin/tablero/data", sameOrigin, requireAdmin, express.text({ type: "text/plain", limit: "40mb" }), async (req, res) => {
  const text = typeof req.body === "string" ? req.body : "";
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { res.status(400).json({ error: "El archivo no es un JSON válido." }); return; }
  const d = parsed as { corte?: unknown; n?: unknown; col?: unknown };
  const corte = Array.isArray(d.corte) && d.corte.length === 2 && d.corte.every(v => Number.isInteger(v)) ? d.corte as number[] : null;
  if (!corte || typeof d.n !== "number" || !Array.isArray(d.col)) {
    res.status(400).json({ error: "El archivo no tiene la estructura del tablero (datos.json generado por Monitor)." }); return;
  }
  const cutoff = `${MESES[corte[1] - 1] ?? ""} ${corte[0]}`.trim();
  const values = { content: text, cutoff, bytes: Buffer.byteLength(text, "utf8"), updatedBy: res.locals.admin.email, updatedAt: new Date() };
  await db.insert(tableroData).values({ id: 1, ...values }).onConflictDoUpdate({ target: tableroData.id, set: values });
  cache = null;
  res.json({ data: await dataMeta() });
});

export default router;
