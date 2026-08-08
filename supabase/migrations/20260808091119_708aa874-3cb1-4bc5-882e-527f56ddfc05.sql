CREATE TABLE public.render_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT 'Queued',
  payload JSONB NOT NULL,
  output_path TEXT,
  error TEXT,
  rendered_frames INTEGER NOT NULL DEFAULT 0,
  total_frames INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX render_jobs_created_at_idx ON public.render_jobs (created_at DESC);

GRANT ALL ON public.render_jobs TO service_role;

ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER render_jobs_set_updated_at
BEFORE UPDATE ON public.render_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_render_job_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('queued', 'dispatched', 'rendering', 'encoding', 'done', 'failed') THEN
    RAISE EXCEPTION 'invalid render job status: %', NEW.status;
  END IF;
  IF NEW.progress < 0 OR NEW.progress > 100 THEN
    RAISE EXCEPTION 'progress must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER render_jobs_validate
BEFORE INSERT OR UPDATE ON public.render_jobs
FOR EACH ROW EXECUTE FUNCTION public.validate_render_job_status();