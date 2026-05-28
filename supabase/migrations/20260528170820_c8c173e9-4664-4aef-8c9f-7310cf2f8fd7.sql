
-- Grant execute on has_role so RLS policies can call it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Ensure user_roles INSERT works from the signup trigger (SECURITY DEFINER already), 
-- and grant select to authenticated (already present, but make sure)
GRANT SELECT ON public.user_roles TO authenticated;

-- Promote the currently signed-in Google user to admin so admin dashboard works
INSERT INTO public.user_roles (user_id, role)
VALUES ('932af846-7cca-46bb-af46-8bc0dea28b4a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
