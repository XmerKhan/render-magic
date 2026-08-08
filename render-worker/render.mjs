// @ts-nocheck
/**
 * AutoCut Studio render worker.
 *
 * Runs on a GitHub Actions runner (4 vCPU / ~16GB RAM on the free tier), which
 * is what Remotion's headless Chromium needs. The runner never sees any project
 * credentials — it authenticates to the app with a single-job access token and
 * receives short-lived signed URLs for the media it must read and the MP4 it
 * must write.
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JOB_ID = process.env.JOB_ID;
const JOB_TOKEN = process.env.JOB_TOKEN;
const APP_URL = (process.env.APP_URL || "").replace(/\/+$/, "");

if (!JOB_ID || !JOB_TOKEN || !APP_URL) {
  console.error("JOB_ID, JOB_TOKEN and APP_URL are all required");
  process.exit(1);
}

const WORKER_ENDPOINT = `${APP_URL}/api/public/render-worker`;
const OUTPUT_FILE = path.join(__dirname, "out", "video.mp4");

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
    await callApp({ action: "progress", progress, message, ...extra }, { retries: 1 });
  } catch (err) {
    console.warn(`Could not report progress: ${err.message}`);
  }
}

async function main() {
  console.log(`Claiming job ${JOB_ID}`);
  const job = await callApp({ action: "claim" });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });

  console.log("Bundling the composition");
  await reportProgress(10, "Bundling the composition");

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
  });

  console.log(
    `Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames`,
  );

  let lastReported = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    inputProps,
    outputLocation: OUTPUT_FILE,
    // Runner has 4 vCPUs; leave one for the encoder.
    concurrency: 3,
    crf: 18,
    chromiumOptions: { gl: "swangle" },
    onProgress: ({ renderedFrames, progress, stitchStage }) => {
      const pct = Math.round(progress * 100);
      if (pct - lastReported < 2) return;
      lastReported = pct;
      void reportProgress(
        pct,
        stitchStage === "muxing" ? "Encoding video" : "Rendering frames",
        {
          status: stitchStage === "muxing" ? "encoding" : "rendering",
          renderedFrames,
        },
      );
    },
  });

  const stats = fs.statSync(OUTPUT_FILE);
  if (!stats.size) throw new Error("Remotion produced an empty file");
  console.log(`Rendered ${(stats.size / 1024 / 1024).toFixed(1)}MB`);

  await reportProgress(96, "Uploading the finished video", { status: "encoding" });

  const upload = await fetch(job.outputUploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fs.readFileSync(OUTPUT_FILE),
  });
  if (!upload.ok) {
    throw new Error(`Upload failed [${upload.status}]: ${await upload.text()}`);
  }

  await callApp({ action: "complete" });
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
