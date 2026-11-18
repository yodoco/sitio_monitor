import { Router, type IRouter, type Request, type Response } from "express";
import type { File } from "@google-cloud/storage";
import { db, mediaUploads } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAdmin, sameOrigin } from "../middlewares/admin";

const router: IRouter = Router();
const storage = new ObjectStorageService();

// Explicit byte ranges keep large videos seekable without downloading them all.
async function serveFile(file: File, req: Request, res: Response) {
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  res.set({ "Content-Type": metadata.contentType ?? "application/octet-stream", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=3600" });
  let start = 0, end = size - 1;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) {
      res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
    }
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!Number.isSafeInteger(start) || start > end || start >= size) {
      res.status(416).set("Content-Range", `bytes */${size}`).end(); return;
    }
    res.status(206).set("Content-Range", `bytes ${start}-${end}/${size}`);
  }
  res.set("Content-Length", String(end - start + 1));
  if (req.method === "HEAD") { res.end(); return; }
  const stream = file.createReadStream({ start, end });
  stream.on("error", () => res.destroy());
  res.on("close", () => stream.destroy());
  stream.pipe(res);
}

router.post("/storage/uploads/request-url", sameOrigin, requireAdmin, async (req, res) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Formato no permitido o archivo mayor a 300 MB. Usa JPG, PNG, WEBP, GIF, MP4, WEBM o PDF." }); return; }
  const uploadURL = await storage.getObjectEntityUploadURL();
  const objectPath = storage.normalizeObjectEntityPath(uploadURL);
  await db.insert(mediaUploads).values({ objectPath, ...parsed.data, ownerId: res.locals.admin.userId });
  res.json(RequestUploadUrlResponse.parse({ uploadURL, objectPath, publicUrl: `/api/storage${objectPath}` }));
});

router.get("/storage/objects/*path", async (req, res) => {
  const parts = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  if (parts.some(p => !p || p === "." || p === ".." || p.includes("\\"))) { res.status(404).end(); return; }
  const objectPath = `/objects/${parts.join("/")}`;
  const [upload] = await db.select().from(mediaUploads).where(eq(mediaUploads.objectPath, objectPath));
  if (!upload) { res.status(404).end(); return; }
  try {
    const file = await storage.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    if (Number(metadata.size) > upload.size || metadata.contentType !== upload.contentType) {
      res.status(415).json({ error: "El archivo no coincide con el tipo o tamaño autorizado." }); return;
    }
    await serveFile(file, req, res);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) { res.status(404).end(); return; }
    throw err;
  }
});
router.get("/storage/public-objects/*path", async (req, res) => {
  const parts = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  if (parts.some(p => !p || p === "." || p === ".." || p.includes("\\"))) { res.status(404).end(); return; }
  const file = await storage.searchPublicObject(parts.join("/"));
  if (!file) { res.status(404).end(); return; }
  await serveFile(file, req, res);
});
export default router;
