// @ts-nocheck
/**
 * Runs once, after every render chunk has finished successfully. Downloads all
 * chunks, keeps the already-rendered H.264 video bitstream, but re-encodes only
 * the audio while stitching. Each chunk is independently muxed by Remotion, so
 * a pure stream-copy concat can preserve AAC priming/timestamp discontinuities
 * at chunk boundaries and cause audible gaps, stutter or drift. Re-encoding the
 * audio track at stitch time is cheap compared with re-rendering video and
 * produces one continuous audio timeline.
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
  if (!res.ok || !res.body) throw new Error(`Download failed [${res.status}]: ${dest}`);
  const file = fs.createWriteStream(dest);
  await res.body.pipeTo(new WritableStream({
    write(chunk) { return new Promise((resolve, reject) => file.write(Buffer.from(chunk), (error) => error ? reject(error) : resolve())); },
    close() { return new Promise((resolve) => file.end(resolve)); },
    abort(error) { file.destroy(error); },
  }));
}

async function uploadFrom(url, source) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(fs.statSync(source).size) },
    body: fs.createReadStream(source),
    duplex: "half",
  });
  if (!response.ok) throw new Error(`Upload failed [${response.status}]: ${await response.text()}`);
}

async function verifyVideo(file, expectedDuration = null) {
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration:stream=index,codec_type,codec_name,width,height,duration",
    "-of", "json", file,
  ]);
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.find((item) => item.codec_type === "video");
  if (!stream || stream.codec_name !== "h264" || !stream.width || !stream.height) {
    throw new Error(`Video validation failed for ${path.basename(file)}`);
  }
  if (expectedDuration && Number(parsed.format?.duration) < expectedDuration * 0.98) {
    throw new Error(`Final video is incomplete (${parsed.format?.duration}s, expected about ${expectedDuration}s)`);
  }
}

async function main() {
  console.log(`Stitching ${CHUNK_COUNT} chunk(s) for job ${JOB_ID}`);
  const { chunkUrls, outputUploadUrl, totalFrames, fps } = await callApp({
    action: "stitch-claim",
    chunkCount: CHUNK_COUNT,
  });
  const expectedDuration = Number(totalFrames) / Number(fps);
  if (!Number.isFinite(expectedDuration) || expectedDuration <= 0) {
    throw new Error("The render service returned an invalid expected duration");
  }

  const chunkPaths = [];
  for (let i = 0; i < chunkUrls.length; i += 1) {
    const dest = path.join(WORKDIR, `chunk-${i}.mp4`);
    console.log(`Downloading chunk ${i + 1}/${chunkUrls.length}`);
    await downloadTo(chunkUrls[i], dest);
    await verifyVideo(dest);
    chunkPaths.push(dest);
  }

  if (chunkPaths.length === 1) {
    console.log("Single chunk — validating and uploading directly");
    await verifyVideo(chunkPaths[0], expectedDuration);
    await uploadFrom(outputUploadUrl, chunkPaths[0]);
    await callApp({ action: "complete" });
    console.log("Done");
    return;
  }

  const listFile = path.join(WORKDIR, "concat.txt");
  fs.writeFileSync(
    listFile,
    chunkPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"),
  );

  const outputFile = path.join(WORKDIR, "final.mp4");
  console.log("Concatenating chunks: copy H.264 video, re-encode audio for continuous timestamps");
  const { stderr } = await run("ffmpeg", [
    "-y",
    "-v", "warning",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    "-af", "aresample=async=1:first_pts=0",
    "-movflags", "+faststart",
    outputFile,
  ]);
  if (stderr) console.log(stderr);

  const stats = fs.statSync(outputFile);
  if (!stats.size) throw new Error("ffmpeg produced an empty file");
  await verifyVideo(outputFile, expectedDuration);
  console.log(`Final video: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);

  await uploadFrom(outputUploadUrl, outputFile);
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
