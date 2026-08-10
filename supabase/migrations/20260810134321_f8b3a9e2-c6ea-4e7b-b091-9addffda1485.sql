CREATE POLICY "No direct client access to render jobs"
ON public.render_jobs
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);