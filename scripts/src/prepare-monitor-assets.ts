import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const assets = path.join(root, "artifacts/monitor/public/assets");
const output = path.join(assets, "clients");
await mkdir(output, { recursive: true });
const entries = [
  ["sweet-lolita", "Sweet Lolita"],
  ["cementerios", "La Colina"],
  ["Mausoleos", "Mausoleos Luz Eterna"],
  ["wb44", "INMEGA Inteligencia de Mercados"],
  ["ruba", "Ruba"],
  ["LogoITESM", "Tecnológico de Monterrey"],
  ["logogenw", "genW"],
  ["logo1_", "FOREX International Trading Group"],
  ["logo_elpotosi", "El Potosí"],
  ["Grupo-Imagen", "Grupo Imagen Multimedia"],
  ["1280px", "Aeroméxico"],
  ["01-RUBRICA", "Universidad Iberoamericana Torreón"],
];
const files = await readdir(assets);
const manifest = [];
for (const [prefix, name] of entries) {
  const filename = files.find(f => f.startsWith(prefix));
  if (!filename) throw new Error(`Missing ${prefix}`);
  const { data, info } = await sharp(path.join(assets, filename)).resize({ width: 1000, withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const total = info.width * info.height;
  let transparent = 0;
  for (let i = 0; i < total; i++) if (data[i * 4 + 3] < 20) transparent++;
  const hasAlpha = transparent > total * .02;
  const corners = [0, info.width - 1, (info.height - 1) * info.width, total - 1];
  // Ruba's roof artwork touches the left corners, so those are not background samples.
  const bg = prefix === "ruba" ? [255, 255, 255] : [0, 1, 2].map(c => corners.reduce((sum, i) => sum + data[i * 4 + c], 0) / 4);
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    let alpha = data[p + 3];
    if (!hasAlpha) {
      const dist = Math.max(...[0, 1, 2].map(c => Math.abs(data[p + c] - bg[c])));
      alpha = Math.round(alpha * Math.min(1, Math.max(0, (dist - 20) / 65)));
    }
    // All silhouettes share a single muted corporate blue, with original antialiasing.
    data[p] = 93; data[p + 1] = 129; data[p + 2] = 149; data[p + 3] = alpha;
  }
  const slug = prefix.replace(/[^a-z0-9]/gi, "").toLowerCase();
  // Trim only empty background, never brand elements; preserve original aspect ratio.
  await sharp(data, { raw: info }).trim({ background: "#00000000", threshold: 10 }).png().toFile(path.join(output, `${slug}.png`));
  manifest.push({ name, src: `/assets/clients/${slug}.png` });
  console.log(`${name}: ${hasAlpha ? "original alpha" : "background removed"}`);
}
await writeFile(path.join(assets, "clients.json"), JSON.stringify(manifest, null, 2));
