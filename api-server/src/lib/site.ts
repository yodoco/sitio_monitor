import { db, siteSettings, adminAccess } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetSiteResponse } from "@workspace/api-zod";

export const defaultContent = {
  heroTitle: "Toma las decisiones de negocio correctas.",
  heroDescription: "Somos una agencia de investigación de mercados con 15 años de experiencia. Te ayudamos a conocer a tu mercado, sus oportunidades y su potencial con insights certeros y oportunos.",
  aboutTitle: "Un profundo conocimiento de la dinámica social de México.",
  aboutDescription: "Basados en Chihuahua, ayudamos a marcas y empresas a conocer a su mercado, sus oportunidades y potencial. Analizamos factores del entorno y tendencias para brindar, de manera certera y oportuna, los insights más valiosos para la toma de decisiones de negocio.",
  aboutImage: "/assets/video-poster.jpg",
  videoUrl: "/api/storage/public-objects/monitor-video.mp4",
  phone: "(614) 251-28-16",
  address: "Calle Aldama 1306, Interior 20, Chihuahua, Chih. México",
  email: "holamonitor@gmail.com",
  facebook: "https://facebook.com/InteligenciaMonitor",
  pages: [],
  insights: [],
};

export async function readSite() {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  return GetSiteResponse.parse(row?.content ?? defaultContent);
}

export async function readAdminEmails() {
  const [row] = await db.select().from(adminAccess).where(eq(adminAccess.id, 1));
  // Trusted address supplied by the owner; access still requires Clerk verification.
  // This default also establishes access in production's separate user store.
  return row?.emails ?? ["holamonitor@gmail.com"];
}

export function safeUrl(value: string, allowMail = false): boolean {
  if (!value) return true;
  if (/^\/(?!\/)/.test(value) && !value.includes("\\") && !/[\u0000-\u001f]/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (allowMail && ["mailto:", "tel:"].includes(url.protocol));
  } catch { return false; }
}
