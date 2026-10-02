import { createFileRoute } from "@tanstack/react-router";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { z } from "zod";

const MAX_ASSET_SIZE = 500 * 1024 * 1024;

const clientPayloadSchema = z.object({
  jobId: z.string().uuid(),
  jobToken: z.string().uuid(),
  key: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative().max(MAX_ASSET_SIZE),
});

const ALLOWED_CONTENT_TYPES = [
  "image/*",
  "video/*",
  "audio/*",
];

export const Route = createFileRoute("/api/public/blob-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as HandleUploadBody;

          const result = await handleUpload({
            body,
            request,
            token: process.env["BLOB_READ_WRITE_TOKEN"],
            onBeforeGenerateToken: async (pathname, clientPayload) => {
              const payload = clientPayloadSchema.parse(JSON.parse(clientPayload || "{}"));
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

              const { data: job, error } = await supabaseAdmin
                .from("render_jobs")
                .select("id, access_token, payload")
                .eq("id", payload.jobId)
                .maybeSingle();

              if (error) throw new Error("Could not validate render upload job.");
              if (!job || job.access_token !== payload.jobToken) {
                throw new Error("Invalid render upload authorization.");
              }

              const storedPayload = job.payload as {
                assetPaths?: Record<string, string>;
              };
              const expectedPath = storedPayload.assetPaths?.[payload.key];

              if (!expectedPath || expectedPath !== pathname) {
                throw new Error("Render upload path is not authorized for this job.");
              }

              return {
                allowedContentTypes: ALLOWED_CONTENT_TYPES,
                maximumSizeInBytes: MAX_ASSET_SIZE,
                allowOverwrite: true,
                validUntil: Date.now() + 60 * 60 * 1000,
                tokenPayload: JSON.stringify({
                  jobId: payload.jobId,
                  key: payload.key,
                  pathname,
                }),
              };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
              console.log("[blob-upload] render asset uploaded", {
                jobId: JSON.parse(tokenPayload || "{}").jobId,
                key: JSON.parse(tokenPayload || "{}").key,
                pathname: blob.pathname,
                size: blob.size,
              });
            },
          });

          return Response.json(result);
        } catch (error) {
          console.error("[blob-upload] failed", error);
          return Response.json(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
