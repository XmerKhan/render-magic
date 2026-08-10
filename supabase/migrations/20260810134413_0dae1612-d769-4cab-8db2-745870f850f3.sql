CREATE TABLE public.render_job_chunks (
  job_id UUID NOT NULL REFERENCES public.render_jobs(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  frame_from INTEGER NOT NULL,
  frame_to INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  attempt INTEGER NOT NULL DEFAULT 0,
  output_path TEXT,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, chunk_index),
  CONSTRAINT render_job_chunks_range CHECK (frame_from >= 0 AND frame_to >= frame_from),
  CONSTRAINT render_job_chunks_progress CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT render_job_chunks_attempt CHECK (attempt >= 0),
  CONSTRAINT render_job_chunks_status CHECK (status IN ('queued', 'rendering', 'retrying', 'completed', 'failed'))
);

GRANT ALL ON public.render_job_chunks TO service_role;

ALTER TABLE public.render_job_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to render chunks"
ON public.render_job_chunks
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE INDEX render_job_chunks_status_idx
ON public.render_job_chunks (job_id, status);

CREATE TRIGGER render_job_chunks_set_updated_at
BEFORE UPDATE ON public.render_job_chunks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();