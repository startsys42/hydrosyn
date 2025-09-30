ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can select roles"
ON public.roles
FOR SELECT
TO authenticated
USING (
    "user" = auth.uid()
);
