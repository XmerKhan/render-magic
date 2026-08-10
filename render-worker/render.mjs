// @ts-nocheck
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOB_ID = process.env.JOB_ID;
const JOB_TOKEN = process.env.JOB_TOKEN;
const APP_URL = (process.env.APP_URL || "").replace(/\/+$/, "");
const CHUNK_INDEX = Number(process.env.CHUNK_INDEX);
const CHUNK_COUNT = Number(process.env.CHUNK_COUNT);
const MAX_ATTEMPTS = Math.max(1, Number(process.env.MAX_CHUNK_ATTEMPTS || 3));

if (!JOB_ID || !JOB_TOKEN || !APP_URL) throw new Error("JOB_ID, JOB_TOKEN and APP_URL are required");
if (!Number.isInteger(CHUNK_INDEX) || !Number.isInteger(CHUNK_COUNT) || CHUNK_COUNT < 1) {
  throw new Error("CHUNK_INDEX and CHUNK_COUNT must be valid integers");
}

const WORKER_ENDPOINT = `${APP_URL}/api/public/render-worker`;
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), `autocut-${CHUNK_INDEX}-`));
const PUBLIC_DIR = path.join(WORKDIR, "public");
const ASSET_DIR = path.join(PUBLIC_DIR, "render-assets");
const OUTPUT_FILE = path.join(WORKDIR, `chunk-${CHUNK_INDEX}.mp4`);
let currentAttempt = 1;
fs.mkdirSync(ASSET_DIR, { recursive: true });

async function callApp(body, { retries = 4 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "AutoCut-Render-Worker" },
        body: JSON.stringify({ ...body, jobId: JOB_ID, jobToken: JOB_TOKEN }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`App ${body.action} failed [${response.status}]: ${text}`);
      return text ? JSON.parse(text) : {};
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** attempt));
    }
  }
  throw lastError;
}

function safeAssetName(key, url) {
  let extension = ".bin";
  try {
    const match = path.extname(new URL(url).pathname).match(/^\.[a-zA-Z0-9]{1,8}$/);
    if (match) extension = match[0];
  } catch {}
  return `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}${extension}`;
}

async function downloadAssets(signedAssets) {
  const localByKey = {};
  await Promise.all(Object.entries(signedAssets).map(async ([key, url]) => {
    const filename = safeAssetName(key, url);
    const destination = path.join(ASSET_DIR, filename);
    const response = await fetch(url);
    if (!response.ok || !response.body) throw new Error(`Asset download failed for ${key} [${response.status}]`);
    const file = fs.createWriteStream(destination);
    await response.body.pipeTo(new WritableStream({
      write(chunk) { return new Promise((resolve, reject) => file.write(Buffer.from(chunk), (error) => error ? reject(error) : resolve())); },
      close() { return new Promise((resolve) => file.end(resolve)); },
      abort(error) { file.destroy(error); },
    }));
    localByKey[key] = `worker-asset:render-assets/${filename}`;
  }));
  return localByKey;
}

function replaceAssetUrls(value, localByKey) {
  const signedToLocal = new Map();
  for (const [key, signedUrl] of Object.entries(value.signedAssets ?? {})) signedToLocal.set(signedUrl, localByKey[key]);
  return JSON.parse(JSON.stringify(value), (_key, item) => typeof item === "string" && signedToLocal.has(item) ? signedToLocal.get(item) : item);
}

function chooseConcurrency() {
  const override = Number(process.env.RENDER_CONCURRENCY);
  if (Number.isInteger(override) && override > 0) return Math.min(override, 8);
  // GitHub-hosted runners are CPU-bound for Chromium rendering. Leave one
  // logical CPU for the OS/FFmpeg and don't oversubscribe the renderer.
  const cpuLimit = Math.max(1, os.cpus().length - 1);
  const memoryLimit = Math.max(1, Math.floor(os.freemem() / (1.5 * 1024 ** 3)));
  return Math.min(6, cpuLimit, memoryLimit);
}

function resourceSnapshot() {
  const cpuPercent = os.cpus().length ? Math.min(100, os.loadavg()[0] / os.cpus().length * 100) : 0;
  return { cpuPercent: Math.round(cpuPercent), memoryMb: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) };
}

async function uploadFile(url, filePath) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(fs.statSync(filePath).size) },
    body: fs.createReadStream(filePath),
    duplex: "half",
  });
  if (!response.ok) throw new Error(`Chunk upload failed [${response.status}]: ${await response.text()}`);
}

async function main() {
  console.log(`Claiming job ${JOB_ID}, chunk ${CHUNK_INDEX + 1}/${CHUNK_COUNT}`);
  const claimed = await callApp({ action: "claim", chunkIndex: CHUNK_INDEX, chunkCount: CHUNK_COUNT });
  if (claimed.alreadyCompleted) {
    console.log("Chunk is already checkpointed; nothing to render");
    return;
  }

  currentAttempt = claimed.attempt;
  console.log(`Attempt ${claimed.attempt}/${MAX_ATTEMPTS}: caching ${Object.keys(claimed.signedAssets ?? {}).length} asset(s)`);
  const localByKey = await downloadAssets(claimed.signedAssets ?? {});
  const localized = replaceAssetUrls(claimed, localByKey);
  const inputProps = { timeline: localized.timeline, settings: localized.settings };

  console.log("Bundling composition with local static assets");
  const serveUrl = await bundle({
    entryPoint: path.resolve(__dirname, "src/index.ts"),
    publicDir: PUBLIC_DIR,
    webpackOverride: (config) => ({
      ...config,
      resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), "@": path.resolve(__dirname, "../src") } },
    }),
  });
  const composition = await selectComposition({ serveUrl, id: "main", inputProps, timeoutInMilliseconds: 220000 });
  const [frameFrom, frameTo] = claimed.frameRange;
  const concurrency = chooseConcurrency();
  console.log(`Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, frames ${frameFrom}-${frameTo}`);
  console.log(`Resources: ${os.cpus().length} CPU(s), ${Math.round(os.totalmem() / 1024 ** 3)}GB RAM; concurrency ${concurrency}`);

  let progress = 0;
  let renderedFrames = 0;
  let lastReport = 0;
  const heartbeat = setInterval(() => {
    const resources = resourceSnapshot();
    console.log(`Heartbeat: ${progress}% (${renderedFrames} frames), CPU ${resources.cpuPercent}%, RAM ${resources.memoryMb}MB`);
    void callApp({ action: "heartbeat", chunkIndex: CHUNK_INDEX, chunkCount: CHUNK_COUNT, progress, renderedFrames, ...resources }, { retries: 1 })
      .catch((error) => console.warn(`Heartbeat failed: ${error.message}`));
  }, 20_000);

  try {
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation: OUTPUT_FILE,
      concurrency,
      crf: 18,
      // Veryfast keeps the same H.264 quality target while substantially
      // reducing CPU time spent in the final encode on CPU-only runners.
      x264Preset: "veryfast",
      frameRange: [frameFrom, frameTo],
      chromiumOptions: { gl: "swangle" },
      timeoutInMilliseconds: 220000,
      onProgress: (state) => {
        progress = Math.round(state.progress * 100);
        renderedFrames = state.renderedFrames;
        if (progress - lastReport < 2) return;
        lastReport = progress;
        void callApp({
          action: "progress",
          chunkIndex: CHUNK_INDEX,
          chunkCount: CHUNK_COUNT,
          progress,
          renderedFrames,
          status: state.stitchStage === "muxing" ? "encoding" : "rendering",
          message: state.stitchStage === "muxing" ? "Encoding chunk" : `Rendering chunk ${CHUNK_INDEX + 1}/${CHUNK_COUNT}`,
        }, { retries: 1 }).catch((error) => console.warn(`Progress report failed: ${error.message}`));
      },
    });
  } finally {
    clearInterval(heartbeat);
  }

  if (!fs.statSync(OUTPUT_FILE).size) throw new Error("Remotion produced an empty chunk");
  await uploadFile(claimed.outputUploadUrl, OUTPUT_FILE);
  await callApp({ action: "complete-chunk", chunkIndex: CHUNK_INDEX, chunkCount: CHUNK_COUNT });
  console.log(`Chunk ${CHUNK_INDEX + 1}/${CHUNK_COUNT} checkpointed successfully`);
}

main().catch(async (error) => {
  console.error(error);
  try {
    const checkpoint = await callApp({ action: "chunk-fail", chunkIndex: CHUNK_INDEX, chunkCount: CHUNK_COUNT, error: String(error?.message ?? error).slice(0, 2000), final: currentAttempt >= MAX_ATTEMPTS });
    void checkpoint;
  } catch (reportError) {
    console.error(`Could not report chunk failure: ${reportError.message}`);
  }
  process.exit(1);
});
