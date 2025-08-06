CREATE POLICY "Usuarios pueden leer su propio perfil"
  ON public.profile
  FOR SELECT
  USING (user = auth.uid());