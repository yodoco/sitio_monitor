import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { readAdminEmails } from "../lib/site";

export async function adminIdentity(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;
  const user = await clerkClient.users.getUser(userId);
  const allowed = await readAdminEmails();
  const verified = user.emailAddresses.filter(e => e.verification?.status === "verified");
  const email = verified.find(e => allowed.includes(e.emailAddress.toLowerCase()))?.emailAddress.toLowerCase();
  return email ? { email, userId } : null;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!getAuth(req).userId) { res.status(401).json({ error: "Inicia sesión para continuar." }); return; }
  const identity = await adminIdentity(req);
  if (!identity) { res.status(403).json({ error: "Esta cuenta no tiene acceso de administrador. Usa un correo autorizado y verificado." }); return; }
  res.locals.admin = identity;
  res.set("Cache-Control", "no-store");
  next();
}

export function sameOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.get("origin");
  const expectedHost = req.get("x-forwarded-host")?.split(",")[0].trim() ?? req.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== expectedHost) {
        res.status(403).json({ error: "Origen de solicitud no permitido." }); return;
      }
    } catch { res.status(403).json({ error: "Origen inválido." }); return; }
  }
  next();
}
