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
