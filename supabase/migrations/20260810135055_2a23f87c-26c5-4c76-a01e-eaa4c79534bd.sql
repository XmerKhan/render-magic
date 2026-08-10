ALTER TABLE public.render_jobs
  ADD COLUMN IF NOT EXISTS completed_chunks INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chunk_attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_chunk INTEGER,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eta_seconds INTEGER;

COMMENT ON COLUMN public.render_jobs.completed_chunks IS 'Number of rendered chunk files safely uploaded to storage.';
COMMENT ON COLUMN public.render_jobs.chunk_attempts IS 'Per-chunk retry attempt counts, indexed by chunk number.';
COMMENT ON COLUMN public.render_jobs.current_chunk IS 'Most recently active zero-based chunk index.';
COMMENT ON COLUMN public.render_jobs.last_heartbeat_at IS 'Latest render worker heartbeat timestamp.';
COMMENT ON COLUMN public.render_jobs.started_at IS 'Timestamp when the first chunk began rendering.';
COMMENT ON COLUMN public.render_jobs.elapsed_seconds IS 'Elapsed wall-clock render time in seconds.';
COMMENT ON COLUMN public.render_jobs.eta_seconds IS 'Estimated seconds remaining, when calculable.';

CREATE OR REPLACE FUNCTION public.validate_render_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('queued', 'dispatched', 'rendering', 'retrying', 'encoding', 'stitching', 'completed', 'done', 'failed') THEN
    RAISE EXCEPTION 'invalid render job status: %', NEW.status;
  END IF;
  IF NEW.progress < 0 OR NEW.progress > 100 THEN
    RAISE EXCEPTION 'progress must be between 0 and 100';
  END IF;
  IF NEW.completed_chunks < 0 OR NEW.completed_chunks > NEW.chunk_count THEN
    RAISE EXCEPTION 'completed_chunks must be between 0 and chunk_count';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;