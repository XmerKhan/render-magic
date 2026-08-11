// @ts-nocheck
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOB_ID = process.env.JOB_ID;
const JOB_TOKEN = process.env.JOB_TOKEN;
const APP_URL = (process.env.APP_URL || "").replace(/\/+$/, "");
const CHUNK_INDEX = Number(process.env.CHUNK_INDEX);
const CHUNK_COUNT = Number(process.env.CHUNK_COUNT);
const MAX_ATTEMPTS = Math.max(1, Number(process.env.MAX_CHUNK_ATTEMPTS || 3));
const run = promisify(execFile);

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

async function optimizeStillImage(source, destination, width, height) {
  await run("ffmpeg", [
    "-y", "-v", "error", "-i", source,
    "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
    "-frames:v", "1", "-q:v", "2", destination,
  ]);
}

function transitionFrames(type, fps, durationSeconds) {
  const normal = Math.max(1, Math.round(durationSeconds * fps));
  if (type === "hard-cut") return 1;
  if (type === "whip-pan") return Math.max(1, Math.round(normal * 0.5));
  return normal;
}

function assetsNeededForFrameRange(signedAssets, timeline, settings, frameRange) {
  const urls = new Set([timeline?.voiceoverUrl, timeline?.musicUrl].filter(Boolean));
  const [frameFrom, frameTo] = frameRange;
  const fps = timeline?.fps || settings?.fps || 30;
  let seriesFrame = settings?.showIntro ? Math.round(3 * fps) : 0;
  for (const [index, scene] of (timeline?.scenes ?? []).entries()) {
    const sceneEnd = seriesFrame + scene.durationFrames - 1;
    if (seriesFrame <= frameTo && sceneEnd >= frameFrom) urls.add(scene?.media?.url);
    if (index < timeline.scenes.length - 1) {
      seriesFrame += scene.durationFrames - transitionFrames(scene.transitionOut, fps, settings?.transitionDuration ?? 0);
    }
  }
  return Object.fromEntries(Object.entries(signedAssets).filter(([, url]) => urls.has(url)));
}

async function downloadAssets(signedAssets, timeline, width, height) {
  const localByKey = {};
  const kindByUrl = new Map();
  for (const scene of timeline?.scenes ?? []) kindByUrl.set(scene?.media?.url, scene?.media?.kind);
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
    if (kindByUrl.get(url) === "image") {
      const optimizedName = `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}-render.jpg`;
      await optimizeStillImage(destination, path.join(ASSET_DIR, optimizedName), width, height);
      fs.rmSync(destination);
      localByKey[key] = `worker-asset:render-assets/${optimizedName}`;
    } else {
      localByKey[key] = `worker-asset:render-assets/${filename}`;
    }
  }));
  return localByKey;
}

function replaceAssetUrls(value, localByKey) {
  const signedToLocal = new Map();
  for (const [key, signedUrl] of Object.entries(value.signedAssets ?? {})) {
    const localUrl = localByKey[key];
    if (localUrl) signedToLocal.set(signedUrl, localUrl);
  }
  return JSON.parse(JSON.stringify(value), (_key, item) => typeof item === "string" && signedToLocal.has(item) ? signedToLocal.get(item) : item);
}

function chooseConcurrency() {
  const override = Number(process.env.RENDER_CONCURRENCY);
  if (Number.isInteger(override) && override > 0) return Math.min(override, 8);
  // OffthreadVideo uses its own FFmpeg extraction threads. On a 4-vCPU
  // GitHub-hosted runner, three Chromium render tabs plus extraction threads
  // oversubscribe the CPU and can cause severe stalls. Keep two render tabs.
  const cpuLimit = Math.max(1, os.cpus().length - 1);
  const memoryLimit = Math.max(1, Math.floor(os.freemem() / (1.5 * 1024 ** 3)));
  return Math.min(2, cpuLimit, memoryLimit);
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
  const startedAt = Date.now();
  const timings = { claimMs: 0, assetsMs: 0, bundleMs: 0, metadataMs: 0, renderMs: 0, encodeMs: 0, uploadMs: 0 };
  const neededAssets = assetsNeededForFrameRange(claimed.signedAssets ?? {}, claimed.timeline, claimed.settings, claimed.frameRange);
  console.log(`Attempt ${claimed.attempt}/${MAX_ATTEMPTS}: caching ${Object.keys(neededAssets).length}/${Object.keys(claimed.signedAssets ?? {}).length} asset(s) used by this chunk`);
  const assetsStartedAt = Date.now();
  const localByKey = await downloadAssets(neededAssets, claimed.timeline, claimed.width, claimed.height);
  timings.assetsMs = Date.now() - assetsStartedAt;
  const localized = replaceAssetUrls(claimed, localByKey);
  const inputProps = { timeline: localized.timeline, settings: localized.settings };

  console.log("Bundling composition with local static assets");
  const bundleStartedAt = Date.now();
  const serveUrl = await bundle({
    entryPoint: path.resolve(__dirname, "src/index.ts"),
    publicDir: PUBLIC_DIR,
    webpackOverride: (config) => ({
      ...config,
      resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), "@": path.resolve(__dirname, "../src") } },
    }),
  });
  timings.bundleMs = Date.now() - bundleStartedAt;
  const metadataStartedAt = Date.now();
  const composition = await selectComposition({ serveUrl, id: "main", inputProps, timeoutInMilliseconds: 220000 });
  timings.metadataMs = Date.now() - metadataStartedAt;
  const [frameFrom, frameTo] = claimed.frameRange;
  const concurrency = chooseConcurrency();
  const offthreadVideoThreads = 1;
  // Keep a larger OffthreadVideo frame cache so long source videos do not
  // repeatedly evict decoded frames and fall back to expensive FFmpeg seeks.
  // 4GB is safe on the 16GB GitHub runner while leaving headroom for Chromium.
  const offthreadVideoCacheSizeInBytes = 4 * 1024 ** 3;

  console.log(`Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, frames ${frameFrom}-${frameTo}`);
  console.log(`Resources: ${os.cpus().length} CPU(s), ${Math.round(os.totalmem() / 1024 ** 3)}GB RAM; concurrency ${concurrency}; OffthreadVideo cache 4096MB; video threads ${offthreadVideoThreads}`);

  let progress = 0;
  let renderedFrames = 0;
  let lastReport = 0;
  let lastLogAt = Date.now();
  let lastLoggedFrames = 0;
  let muxingStartedAt = 0;
  const renderStartedAt = Date.now();
  const heartbeat = setInterval(() => {
    const resources = resourceSnapshot();
    const now = Date.now();
    const intervalFps = (renderedFrames - lastLoggedFrames) / Math.max(0.001, (now - lastLogAt) / 1000);
    const averageFps = renderedFrames / Math.max(0.001, (now - renderStartedAt) / 1000);
    console.log(`PERF phase=render progress=${progress}% frames=${renderedFrames} interval_fps=${intervalFps.toFixed(2)} average_fps=${averageFps.toFixed(2)} cpu=${resources.cpuPercent}% ram_mb=${resources.memoryMb}`);
    lastLogAt = now;
    lastLoggedFrames = renderedFrames;
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
      x264Preset: "veryfast",
      frameRange: [frameFrom, frameTo],
      chromiumOptions: {
        enableMultiProcessOnLinux: true,
      },
      timeoutInMilliseconds: 220000,
      offthreadVideoCacheSizeInBytes,
      offthreadVideoThreads,
      logLevel: "info",
      onProgress: (state) => {
        progress = Math.round(state.progress * 100);
        renderedFrames = state.renderedFrames;
        if (state.stitchStage === "muxing" && !muxingStartedAt) muxingStartedAt = Date.now();
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
  const renderFinishedAt = Date.now();
  timings.renderMs = (muxingStartedAt || renderFinishedAt) - renderStartedAt;
  timings.encodeMs = muxingStartedAt ? renderFinishedAt - muxingStartedAt : 0;

  if (!fs.statSync(OUTPUT_FILE).size) throw new Error("Remotion produced an empty chunk");
  const uploadStartedAt = Date.now();
  await uploadFile(claimed.outputUploadUrl, OUTPUT_FILE);
  timings.uploadMs = Date.now() - uploadStartedAt;
  await callApp({ action: "complete-chunk", chunkIndex: CHUNK_INDEX, chunkCount: CHUNK_COUNT });
  const elapsedSeconds = (Date.now() - startedAt) / 1000;
  const frameCount = frameTo - frameFrom + 1;
  console.log(`PERF_SUMMARY ${JSON.stringify({ chunk: CHUNK_INDEX, frames: frameCount, fps: Number((frameCount / elapsedSeconds).toFixed(2)), elapsedSeconds: Number(elapsedSeconds.toFixed(2)), peakPhase: "complete", timings })}`);
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
