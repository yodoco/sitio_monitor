import { ReplitConnectors } from "@replit/connectors-sdk";
import type { InquiryRecord } from "@workspace/db";
const connectors = new ReplitConnectors();
export const emailRecipient = "holamonitor@gmail.com";

export function emailStatus() {
  return {
    emailConfigured: Boolean(process.env.RESEND_FROM_EMAIL),
    emailRecipient,
    emailNote: process.env.RESEND_FROM_EMAIL
      ? "Resend conectado. El estado de cada solicitud indica si Resend aceptó su notificación; no confirma entrega en bandeja."
      : "Solicitudes guardadas en el panel. Falta configurar RESEND_FROM_EMAIL con un remitente de dominio verificado en Resend para enviar notificaciones.",
  };
}

export async function notifyInquiry(inquiry: InquiryRecord): Promise<boolean> {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) return false;
  const response = await connectors.proxy("resend", "/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `monitor-inquiry-${inquiry.id}` },
    body: JSON.stringify({
      from,
      to: [emailRecipient],
      reply_to: inquiry.email,
      subject: `MONITOR · ${inquiry.kind === "cotizacion" ? "Solicitud de cotización" : "Contacto"} #${inquiry.id}`,
      text: `Nombre: ${inquiry.name}\nEmpresa: ${inquiry.company}\nCorreo: ${inquiry.email}\nTeléfono: ${inquiry.phone}\nServicio: ${inquiry.service}\n\n${inquiry.message}`,
    }),
  });
  if (!response.ok) throw new Error(`Resend notification rejected: ${response.status}`);
  const data = await response.json() as { id?: string };
  return Boolean(data.id);
}
