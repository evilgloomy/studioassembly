
-- =====================================================
-- 1. Visitor Relationships table
-- =====================================================
CREATE TABLE public.caerhold_visitor_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  affection numeric NOT NULL DEFAULT 0,
  trust numeric NOT NULL DEFAULT 0,
  comfort numeric NOT NULL DEFAULT 0,
  respect numeric NOT NULL DEFAULT 0,
  compatibility numeric NOT NULL DEFAULT 0,
  composite_score numeric NOT NULL DEFAULT 0,
  interaction_count integer NOT NULL DEFAULT 0,
  last_interaction timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, resident_id)
);

ALTER TABLE public.caerhold_visitor_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships"
  ON public.caerhold_visitor_relationships FOR SELECT
  USING (user_id = auth.uid() OR is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Users can create own relationships"
  ON public.caerhold_visitor_relationships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own relationships"
  ON public.caerhold_visitor_relationships FOR UPDATE
  USING (user_id = auth.uid());

CREATE TRIGGER update_visitor_relationships_updated_at
  BEFORE UPDATE ON public.caerhold_visitor_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. Relationship Events table
-- =====================================================
CREATE TABLE public.caerhold_relationship_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  tag text NOT NULL,
  base_impact numeric NOT NULL DEFAULT 0,
  delta_affection numeric NOT NULL DEFAULT 0,
  delta_trust numeric NOT NULL DEFAULT 0,
  delta_comfort numeric NOT NULL DEFAULT 0,
  delta_respect numeric NOT NULL DEFAULT 0,
  delta_compatibility numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caerhold_relationship_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.caerhold_relationship_events FOR SELECT
  USING (user_id = auth.uid() OR is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Users can insert own events"
  ON public.caerhold_relationship_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. Chat Messages table
-- =====================================================
CREATE TABLE public.caerhold_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  emotional_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caerhold_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.caerhold_chat_messages FOR SELECT
  USING (user_id = auth.uid() OR is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Users can insert own messages"
  ON public.caerhold_chat_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. RPC: update_caerhold_relationship_scores
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_caerhold_relationship_scores(
  p_user_id uuid,
  p_resident_id uuid,
  p_tag text,
  p_base_impact numeric,
  p_delta_affection numeric DEFAULT 0,
  p_delta_trust numeric DEFAULT 0,
  p_delta_comfort numeric DEFAULT 0,
  p_delta_respect numeric DEFAULT 0,
  p_delta_compatibility numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rel caerhold_visitor_relationships%ROWTYPE;
  v_new_affection numeric;
  v_new_trust numeric;
  v_new_comfort numeric;
  v_new_respect numeric;
  v_new_compatibility numeric;
  v_new_composite numeric;
  v_tier text;
BEGIN
  -- Ensure caller is the user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Upsert relationship
  INSERT INTO caerhold_visitor_relationships (user_id, resident_id)
  VALUES (p_user_id, p_resident_id)
  ON CONFLICT (user_id, resident_id) DO NOTHING;

  SELECT * INTO v_rel FROM caerhold_visitor_relationships
  WHERE user_id = p_user_id AND resident_id = p_resident_id
  FOR UPDATE;

  -- Clamp dimensions 0-100
  v_new_affection := GREATEST(0, LEAST(100, v_rel.affection + p_delta_affection));
  v_new_trust := GREATEST(0, LEAST(100, v_rel.trust + p_delta_trust));
  v_new_comfort := GREATEST(0, LEAST(100, v_rel.comfort + p_delta_comfort));
  v_new_respect := GREATEST(0, LEAST(100, v_rel.respect + p_delta_respect));
  v_new_compatibility := GREATEST(0, LEAST(100, v_rel.compatibility + p_delta_compatibility));

  -- Weighted composite
  v_new_composite := (v_new_affection * 0.25 + v_new_trust * 0.25 + v_new_comfort * 0.2 + v_new_respect * 0.15 + v_new_compatibility * 0.15);

  -- Determine tier
  v_tier := CASE
    WHEN v_new_composite >= 76 THEN 'Confidant'
    WHEN v_new_composite >= 56 THEN 'Friend'
    WHEN v_new_composite >= 36 THEN 'Neighbor'
    WHEN v_new_composite >= 16 THEN 'Acquaintance'
    ELSE 'Stranger'
  END;

  -- Update relationship
  UPDATE caerhold_visitor_relationships SET
    affection = v_new_affection,
    trust = v_new_trust,
    comfort = v_new_comfort,
    respect = v_new_respect,
    compatibility = v_new_compatibility,
    composite_score = v_new_composite,
    interaction_count = v_rel.interaction_count + 1,
    last_interaction = now()
  WHERE id = v_rel.id;

  -- Log event
  INSERT INTO caerhold_relationship_events (
    user_id, resident_id, tag, base_impact,
    delta_affection, delta_trust, delta_comfort, delta_respect, delta_compatibility
  ) VALUES (
    p_user_id, p_resident_id, p_tag, p_base_impact,
    p_delta_affection, p_delta_trust, p_delta_comfort, p_delta_respect, p_delta_compatibility
  );

  RETURN jsonb_build_object(
    'affection', v_new_affection,
    'trust', v_new_trust,
    'comfort', v_new_comfort,
    'respect', v_new_respect,
    'compatibility', v_new_compatibility,
    'composite_score', v_new_composite,
    'tier', v_tier,
    'interaction_count', v_rel.interaction_count + 1
  );
END;
$$;
