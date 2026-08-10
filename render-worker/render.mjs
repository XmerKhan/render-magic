// @ts-nocheck
/**
 * AutoCut Studio render worker.
 *
 * Runs on a GitHub Actions runner (2 vCPU / ~7GB RAM on the free tier). One
 * long render used to run serially in a single job and could take longer
 * than the video itself was worth waiting for (and risked the 60-minute job
 * timeout on longer videos). Instead, the app splits the timeline into
 * `CHUNK_COUNT` frame ranges and dispatches one GitHub Actions matrix job per
 * chunk (see .github/workflows/render.yml) - this script renders exactly one
 * chunk. A separate stitch job concatenates every chunk once they've all
 * finished.
 *
 * The runner never sees any project credentials — it authenticates to the
 * app with a single-job access token and receives short-lived signed URLs
 * for the media it must read and the chunk it must write.
 */
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

if (!JOB_ID || !JOB_TOKEN || !APP_URL) {
  console.error("JOB_ID, JOB_TOKEN and APP_URL are all required");
  process.exit(1);
}
if (!Number.isInteger(CHUNK_INDEX) || !Number.isInteger(CHUNK_COUNT) || CHUNK_COUNT < 1) {
  console.error("CHUNK_INDEX and CHUNK_COUNT must be set to integers (CHUNK_COUNT >= 1)");
  process.exit(1);
}

const WORKER_ENDPOINT = `${APP_URL}/api/public/render-worker`;
const OUTPUT_FILE = path.join(__dirname, "out", `chunk-${CHUNK_INDEX}.mp4`);

async function callApp(body, { retries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, jobId: JOB_ID, jobToken: JOB_TOKEN }),
      });
      const text = await res.text();
      if (!res.ok) {
        // 4xx means the app rejected us on purpose; retrying will not help.
        if (res.status >= 400 && res.status < 500) {
          throw new Error(`App rejected ${body.action} [${res.status}]: ${text}`);
        }
        throw new Error(`App error on ${body.action} [${res.status}]: ${text}`);
      }
      return text ? JSON.parse(text) : {};
    } catch (err) {
      lastError = err;
      if (String(err.message).includes("App rejected")) throw err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
  }
  throw lastError;
}

/** Progress reporting is best-effort: it must never fail the render. */
async function reportProgress(progress, message, extra = {}) {
  try {
    await callApp(
      {
        action: "progress",
        chunkIndex: CHUNK_INDEX,
        chunkCount: CHUNK_COUNT,
        progress,
        message,
        ...extra,
      },
      { retries: 1 },
    );
  } catch (err) {
    console.warn(`Could not report progress: ${err.message}`);
  }
}

async function main() {
  console.log(`Claiming job ${JOB_ID}, chunk ${CHUNK_INDEX + 1}/${CHUNK_COUNT}`);
  const job = await callApp({
    action: "claim",
    chunkIndex: CHUNK_INDEX,
    chunkCount: CHUNK_COUNT,
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  console.log("Bundling the composition");
  await reportProgress(5, "Bundling the composition");

  const serveUrl = await bundle({
    entryPoint: path.resolve(__dirname, "src/index.ts"),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          // The worker reuses the app's own Remotion components verbatim.
          "@": path.resolve(__dirname, "../src"),
        },
      },
    }),
  });

  const inputProps = { timeline: job.timeline, settings: job.settings };

  const composition = await selectComposition({
    serveUrl,
    id: "main",
    inputProps,
    timeoutInMilliseconds: 220000,
  });

  const [frameFrom, frameTo] = job.frameRange;
  console.log(
    `Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, ` +
      `frames ${frameFrom}-${frameTo} of ${composition.durationInFrames - 1} total`,
  );

  // GitHub-hosted runners: 2 vCPU/~7GB on private free-tier repos, 4 vCPU/~16GB
  // on public ones. This composition renders video plus a CSS color-grade
  // filter, which is heavy enough that using every core crashed Chrome tabs
  // mid-render ("Target closed" - Remotion's own docs point at memory/CPU
  // overload for that error: https://remotion.dev/docs/target-closed).
  // Using half the cores (min 1) leaves enough headroom regardless of runner
  // size. Parallelism mainly comes from the chunk matrix anyway.
  const cpuCount = os.cpus().length || 1;
  const concurrency = Math.max(1, Math.floor(cpuCount / 2));
  console.log(`Detected ${cpuCount} CPU core(s); using concurrency ${concurrency}`);

  let lastReported = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    inputProps,
    outputLocation: OUTPUT_FILE,
    concurrency,
    crf: 18,
    frameRange: [frameFrom, frameTo],
    chromiumOptions: { gl: "swangle" },
    // Default is 30s. With many chunks fetching media from Supabase Storage
    // in parallel, an individual image/audio load can occasionally take
    // longer than that under contention - better to wait than to crash.
    timeoutInMilliseconds: 220000,
    onProgress: ({ renderedFrames, progress, stitchStage }) => {
      const pct = Math.round(progress * 100);
      if (pct - lastReported < 2) return;
      lastReported = pct;
      void reportProgress(pct, stitchStage === "muxing" ? "Encoding chunk" : "Rendering frames", {
        status: stitchStage === "muxing" ? "encoding" : "rendering",
        renderedFrames,
      });
    },
  });

  const stats = fs.statSync(OUTPUT_FILE);
  if (!stats.size) throw new Error("Remotion produced an empty file");
  console.log(
    `Rendered chunk ${CHUNK_INDEX + 1}/${CHUNK_COUNT}: ${(stats.size / 1024 / 1024).toFixed(1)}MB`,
  );

  await reportProgress(96, "Uploading chunk", { status: "encoding" });

  const upload = await fetch(job.outputUploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fs.readFileSync(OUTPUT_FILE),
  });
  if (!upload.ok) {
    throw new Error(`Chunk upload failed [${upload.status}]: ${await upload.text()}`);
  }

  await reportProgress(100, "Chunk done");
  console.log("Done");
}

main().catch(async (err) => {
  console.error(err);
  try {
    await callApp({ action: "fail", error: String(err?.message ?? err).slice(0, 2000) });
  } catch (reportErr) {
    console.error(`Could not report failure: ${reportErr.message}`);
  }
  process.exit(1);
});
