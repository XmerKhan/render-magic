// @ts-nocheck
/**
 * Runs once, after every render chunk (see render.mjs) has finished
 * successfully — GitHub Actions' `needs: render` guarantees that. Downloads
 * every chunk's MP4, concatenates them losslessly with ffmpeg (same codec,
 * resolution and fps in every chunk, so this is a stream copy, not a
 * re-encode) and uploads the final video.
 *
 * Deliberately dependency-free: this job doesn't need Remotion, Chromium, or
 * the app's node_modules at all, so it runs in a few seconds rather than
 * needing the full render-worker install.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const JOB_ID = process.env.JOB_ID;
const JOB_TOKEN = process.env.JOB_TOKEN;
const APP_URL = (process.env.APP_URL || "").replace(/\/+$/, "");
const CHUNK_COUNT = Number(process.env.CHUNK_COUNT);

if (!JOB_ID || !JOB_TOKEN || !APP_URL) {
  console.error("JOB_ID, JOB_TOKEN and APP_URL are all required");
  process.exit(1);
}
if (!Number.isInteger(CHUNK_COUNT) || CHUNK_COUNT < 1) {
  console.error("CHUNK_COUNT must be a positive integer");
  process.exit(1);
}

const WORKER_ENDPOINT = `${APP_URL}/api/public/render-worker`;
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), "stitch-"));

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

async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed [${res.status}]: ${dest}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

async function main() {
  console.log(`Stitching ${CHUNK_COUNT} chunk(s) for job ${JOB_ID}`);
  const { chunkUrls, outputUploadUrl } = await callApp({
    action: "stitch-claim",
    chunkCount: CHUNK_COUNT,
  });

  if (chunkUrls.length === 1) {
    console.log("Single chunk — skipping ffmpeg concat, uploading it directly");
    const chunkPath = path.join(WORKDIR, "chunk-0.mp4");
    await downloadTo(chunkUrls[0], chunkPath);
    const upload = await fetch(outputUploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4" },
      body: fs.readFileSync(chunkPath),
    });
    if (!upload.ok) throw new Error(`Upload failed [${upload.status}]: ${await upload.text()}`);
    await callApp({ action: "complete" });
    console.log("Done");
    return;
  }

  const chunkPaths = [];
  for (let i = 0; i < chunkUrls.length; i += 1) {
    const dest = path.join(WORKDIR, `chunk-${i}.mp4`);
    console.log(`Downloading chunk ${i + 1}/${chunkUrls.length}`);
    await downloadTo(chunkUrls[i], dest);
    chunkPaths.push(dest);
  }

  const listFile = path.join(WORKDIR, "concat.txt");
  fs.writeFileSync(
    listFile,
    chunkPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
  );

  const outputFile = path.join(WORKDIR, "final.mp4");
  console.log("Concatenating chunks with ffmpeg");
  await run("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-c", "copy",
    outputFile,
  ]);

  const stats = fs.statSync(outputFile);
  if (!stats.size) throw new Error("ffmpeg produced an empty file");
  console.log(`Final video: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);

  const upload = await fetch(outputUploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fs.readFileSync(outputFile),
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
