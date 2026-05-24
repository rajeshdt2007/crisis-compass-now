
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'ngo');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_pregnant BOOLEAN DEFAULT false,
  is_child BOOLEAN DEFAULT false,
  is_minor BOOLEAN DEFAULT false,
  is_elderly BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SOS alerts
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  vulnerability JSONB DEFAULT '{}'::jsonb,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- NGOs
CREATE TABLE public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  city TEXT,
  phone TEXT,
  website TEXT,
  donation_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'dashboard',
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Missing persons
CREATE TABLE public.missing_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT,
  description TEXT,
  last_seen TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  contact TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.missing_persons ENABLE ROW LEVEL SECURITY;

-- Resource distributions
CREATE TABLE public.resource_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  ngo_id UUID REFERENCES public.ngos(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.resource_distributions ENABLE ROW LEVEL SECURITY;

-- Ambulances
CREATE TABLE public.ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  assigned_alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;

-- Rescues
CREATE TABLE public.rescues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE NOT NULL
);
ALTER TABLE public.rescues ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============

-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admin views all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin views roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- sos_alerts
CREATE POLICY "create own sos" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "view own sos" ON public.sos_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin views all sos" ON public.sos_alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin updates sos" ON public.sos_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ngos
CREATE POLICY "anyone views ngos" ON public.ngos FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages ngos" ON public.ngos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "admin views notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin creates notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- missing_persons
CREATE POLICY "anyone views missing" ON public.missing_persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own missing" ON public.missing_persons FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "update own missing" ON public.missing_persons FOR UPDATE TO authenticated USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

-- resource_distributions
CREATE POLICY "anyone views distributions" ON public.resource_distributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages distributions" ON public.resource_distributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ambulances
CREATE POLICY "anyone views ambulances" ON public.ambulances FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages ambulances" ON public.ambulances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- rescues
CREATE POLICY "anyone views rescues" ON public.rescues FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manages rescues" ON public.rescues FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missing_persons;

-- Storage bucket for missing person photos
INSERT INTO storage.buckets (id, name, public) VALUES ('missing-persons', 'missing-persons', true);

CREATE POLICY "anyone reads missing photos" ON storage.objects FOR SELECT USING (bucket_id = 'missing-persons');
CREATE POLICY "authenticated uploads missing photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'missing-persons');
