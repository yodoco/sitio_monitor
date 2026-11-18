import { Storage } from "@google-cloud/storage";
import path from "node:path";

const storage = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token",
    type: "external_account",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});
const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(",")[0];
if (!publicPath) throw new Error("App Storage not configured");
const [bucket, ...prefix] = publicPath.replace(/^\//, "").split("/");
const source = process.argv[2] || path.resolve(import.meta.dirname, "../../generated-artifacts/monitor-video.mp4");
const name = process.argv[3] || "monitor-video.mp4";
await storage.bucket(bucket).upload(source, {
  destination: `${prefix.join("/")}/${name}`,
  metadata: { contentType: name.endsWith(".webm") ? "video/webm" : "video/mp4", cacheControl: "public, max-age=86400" },
});
console.log(`Video stored: /api/storage/public-objects/${name}`);
