-- Long renders are split into parallel chunks (one GitHub Actions matrix job
-- per chunk) and then stitched together, instead of one job rendering the
-- whole timeline serially on 2 vCPUs. These columns track that fan-out.
ALTER TABLE public.render_jobs
  ADD COLUMN chunk_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN chunk_progress JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.render_jobs.chunk_count IS
  'Number of parallel render chunks this job was split into (1 = not chunked).';
COMMENT ON COLUMN public.render_jobs.chunk_progress IS
  'Per-chunk progress percentages (0-100), index = chunk index. Averaged into the row''s overall progress.';

-- Allow the new "stitching" status (chunks finished, ffmpeg concat in progress).
CREATE OR REPLACE FUNCTION public.validate_render_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('queued', 'dispatched', 'rendering', 'encoding', 'stitching', 'done', 'failed') THEN
    RAISE EXCEPTION 'invalid render job status: %', NEW.status;
  END IF;
  IF NEW.progress < 0 OR NEW.progress > 100 THEN
    RAISE EXCEPTION 'progress must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
