
-- PROFILES: drop broad read
DROP POLICY IF EXISTS "auth views all profiles" ON public.profiles;
CREATE POLICY "admin views all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- SOS_ALERTS: drop broad read and broad update
DROP POLICY IF EXISTS "auth views all sos" ON public.sos_alerts;
DROP POLICY IF EXISTS "auth updates sos" ON public.sos_alerts;
CREATE POLICY "admin views all sos" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner or admin updates sos" ON public.sos_alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- AMBULANCES: restrict writes to admin
DROP POLICY IF EXISTS "auth manages ambulances" ON public.ambulances;
CREATE POLICY "admin manages ambulances" ON public.ambulances
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RESCUES: restrict writes to admin
DROP POLICY IF EXISTS "auth manages rescues" ON public.rescues;
CREATE POLICY "admin manages rescues" ON public.rescues
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RESOURCE DISTRIBUTIONS: restrict writes to admin
DROP POLICY IF EXISTS "auth manages distributions" ON public.resource_distributions;
CREATE POLICY "admin manages distributions" ON public.resource_distributions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS: restrict INSERT to admin
DROP POLICY IF EXISTS "auth creates notifications" ON public.notifications;
CREATE POLICY "admin creates notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- STORAGE: missing-persons UPDATE/DELETE restricted to uploader
CREATE POLICY "owners update missing-persons files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'missing-persons' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'missing-persons' AND owner = auth.uid());

CREATE POLICY "owners delete missing-persons files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'missing-persons' AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin')));
