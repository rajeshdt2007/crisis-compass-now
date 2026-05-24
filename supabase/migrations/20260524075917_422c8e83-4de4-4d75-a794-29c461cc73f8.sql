
-- sos_alerts
DROP POLICY IF EXISTS "admin views all sos" ON public.sos_alerts;
DROP POLICY IF EXISTS "admin updates sos" ON public.sos_alerts;
CREATE POLICY "auth views all sos" ON public.sos_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth updates sos" ON public.sos_alerts FOR UPDATE TO authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "admin views all profiles" ON public.profiles;
CREATE POLICY "auth views all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- ambulances
DROP POLICY IF EXISTS "admin manages ambulances" ON public.ambulances;
CREATE POLICY "auth manages ambulances" ON public.ambulances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- rescues
DROP POLICY IF EXISTS "admin manages rescues" ON public.rescues;
CREATE POLICY "auth manages rescues" ON public.rescues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- resource_distributions
DROP POLICY IF EXISTS "admin manages distributions" ON public.resource_distributions;
CREATE POLICY "auth manages distributions" ON public.resource_distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- notifications
DROP POLICY IF EXISTS "admin views notifications" ON public.notifications;
DROP POLICY IF EXISTS "admin creates notifications" ON public.notifications;
CREATE POLICY "auth views notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth creates notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
