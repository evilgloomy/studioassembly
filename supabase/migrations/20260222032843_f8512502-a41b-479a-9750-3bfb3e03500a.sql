
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'editor' THEN 2
      WHEN 'author' THEN 3
      WHEN 'caerhold_admin' THEN 4
      WHEN 'caerhold_editor' THEN 5
    END
  LIMIT 1;
$$;
