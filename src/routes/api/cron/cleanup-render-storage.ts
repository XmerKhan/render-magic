import { createFileRoute } from "@tanstack/react-router";

const RETENTION_MS = 2 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function deleteBlobs(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return 0;
  const { del } = await import("@vercel/blob");
  await del(unique, { token: process.env["BLOB_READ_WRITE_TOKEN"] });
  return unique.length;
}

export const Route = createFileRoute("/api/cron/cleanup-render-storage")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthorized(request)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();

        const { data: jobs, error } = await supabaseAdmin
          .from("render_jobs")
          .select("id, status, payload, output_path, created_at, chunk_count")
          .lt("created_at", cutoff)
          .in("status", ["done", "completed", "failed"])
          .limit(100);

        if (error) {
          console.error("[cron-cleanup] job query failed", error);
          return Response.json({ error: error.message }, { status: 500 });
        }

        let deleted = 0;
        for (const job of jobs ?? []) {
          const payload = job.payload as {
            assetPaths?: Record<string, string>;
          };
          const chunkCount = Math.max(1, Number(job.chunk_count ?? 1));
          const chunkPaths = Array.from(
            { length: chunkCount },
            (_, index) => `${job.id}/chunks/chunk-${index}.mp4`,
          );
          const paths = [
            ...Object.values(payload.assetPaths ?? {}),
            ...chunkPaths,
          ];

          if (job.output_path?.includes(".blob.vercel-storage.com/")) {
            paths.push(job.output_path);
          }

          try {
            deleted += await deleteBlobs(paths);
            await supabaseAdmin
              .from("render_jobs")
              .update({ output_path: null })
              .eq("id", job.id);
          } catch (cleanupError) {
            console.error("[cron-cleanup] Blob cleanup failed", {
              jobId: job.id,
              error: cleanupError,
            });
          }
        }

        return Response.json({
          ok: true,
          jobsChecked: jobs?.length ?? 0,
          blobsDeleted: deleted,
          cutoff,
        });
      },
    },
  },
});
