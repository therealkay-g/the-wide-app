-- WIDE RLS Policies (fixed - no recursion)

-- Helper functions (safe - don't query family_members from policies on family_members)
CREATE OR REPLACE FUNCTION public.is_family_member(family_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = family_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_family_role(family_uuid uuid)
RETURNS text AS $$
  SELECT role FROM public.family_members
  WHERE family_id = family_uuid AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_family(family_uuid uuid)
RETURNS boolean AS $$
  SELECT public.get_family_role(family_uuid) IN ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_family_owner_or_admin(family_uuid uuid)
RETURNS boolean AS $$
  SELECT public.get_family_role(family_uuid) IN ('OWNER', 'ADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- FAMILIES
-- =============================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "families_select" ON public.families; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "families_insert" ON public.families; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "families_update" ON public.families; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "families_delete" ON public.families; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "families_select" ON public.families FOR SELECT USING (
  auth.uid() = owner_id OR public.is_family_member(id)
);
CREATE POLICY "families_insert" ON public.families FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "families_update" ON public.families FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "families_delete" ON public.families FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- FAMILY MEMBERS (NO RECURSION - simple policies only)
-- =============================================
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "fm_select" ON public.family_members; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "fm_insert" ON public.family_members; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "fm_delete" ON public.family_members; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "fm_update" ON public.family_members; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Members can see other members in their families (uses SECURITY DEFINER function, not recursive)
CREATE POLICY "fm_select" ON public.family_members FOR SELECT
  USING (public.is_family_member(family_id));

-- Owner can add anyone, or user can add themselves
CREATE POLICY "fm_insert" ON public.family_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
  );

-- Owner can delete members
CREATE POLICY "fm_delete" ON public.family_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
  );

-- Owner can update roles
CREATE POLICY "fm_update" ON public.family_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.families WHERE id = family_id AND owner_id = auth.uid())
  );

-- =============================================
-- PLACES
-- =============================================
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "places_select" ON public.places; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "places_insert" ON public.places; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "places_update" ON public.places; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "places_delete" ON public.places; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "places_select" ON public.places FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "places_insert" ON public.places FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "places_update" ON public.places FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "places_delete" ON public.places FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- TREES
-- =============================================
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "trees_select" ON public.trees; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "trees_insert" ON public.trees; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "trees_update" ON public.trees; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "trees_delete" ON public.trees; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "trees_select" ON public.trees FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "trees_insert" ON public.trees FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "trees_update" ON public.trees FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "trees_delete" ON public.trees FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- PERSONS
-- =============================================
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "persons_select" ON public.persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "persons_insert" ON public.persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "persons_update" ON public.persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "persons_delete" ON public.persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "persons_select" ON public.persons FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "persons_insert" ON public.persons FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "persons_update" ON public.persons FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "persons_delete" ON public.persons FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- RELATIONSHIPS
-- =============================================
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "rels_select" ON public.relationships; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "rels_insert" ON public.relationships; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "rels_update" ON public.relationships; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "rels_delete" ON public.relationships; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "rels_select" ON public.relationships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_family_member(p.family_id))
);
CREATE POLICY "rels_insert" ON public.relationships FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);
CREATE POLICY "rels_update" ON public.relationships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);
CREATE POLICY "rels_delete" ON public.relationships FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);

-- =============================================
-- EVENTS
-- =============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "events_select" ON public.events; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "events_insert" ON public.events; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "events_update" ON public.events; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "events_delete" ON public.events; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "events_select" ON public.events FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "events_delete" ON public.events FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- SOURCES
-- =============================================
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sources_select" ON public.sources; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "sources_insert" ON public.sources; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "sources_update" ON public.sources; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "sources_delete" ON public.sources; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "sources_select" ON public.sources FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "sources_insert" ON public.sources FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "sources_update" ON public.sources FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "sources_delete" ON public.sources FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- DOCUMENTS
-- =============================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "docs_select" ON public.documents; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "docs_insert" ON public.documents; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "docs_delete" ON public.documents; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "docs_select" ON public.documents FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "docs_insert" ON public.documents FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "docs_delete" ON public.documents FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- DOCUMENT PERSONS
-- =============================================
ALTER TABLE public.document_persons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "dp_select" ON public.document_persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "dp_insert" ON public.document_persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "dp_delete" ON public.document_persons; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "dp_select" ON public.document_persons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_family_member(d.family_id))
);
CREATE POLICY "dp_insert" ON public.document_persons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.can_edit_family(d.family_id))
);
CREATE POLICY "dp_delete" ON public.document_persons FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.can_edit_family(d.family_id))
);

-- =============================================
-- TESTIMONIES
-- =============================================
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "test_select" ON public.testimonies; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "test_insert" ON public.testimonies; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "test_update" ON public.testimonies; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "test_delete" ON public.testimonies; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "test_select" ON public.testimonies FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "test_insert" ON public.testimonies FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "test_update" ON public.testimonies FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "test_delete" ON public.testimonies FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- STORIES
-- =============================================
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "stories_select" ON public.stories; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "stories_insert" ON public.stories; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "stories_update" ON public.stories; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "stories_delete" ON public.stories; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "stories_update" ON public.stories FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- RESEARCHES
-- =============================================
ALTER TABLE public.researches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "research_select" ON public.researches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "research_insert" ON public.researches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "research_update" ON public.researches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "research_delete" ON public.researches; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "research_select" ON public.researches FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "research_insert" ON public.researches FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "research_update" ON public.researches FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "research_delete" ON public.researches FOR DELETE USING (auth.uid() = created_by);

-- =============================================
-- FAMILY MIGRATIONS
-- =============================================
ALTER TABLE public.family_migrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "mig_select" ON public.family_migrations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "mig_insert" ON public.family_migrations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "mig_update" ON public.family_migrations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "mig_delete" ON public.family_migrations; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "mig_select" ON public.family_migrations FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "mig_insert" ON public.family_migrations FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "mig_update" ON public.family_migrations FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "mig_delete" ON public.family_migrations FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- INVITATIONS
-- =============================================
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "inv_select" ON public.invitations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "inv_insert" ON public.invitations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "inv_update" ON public.invitations; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "inv_delete" ON public.invitations; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "inv_select" ON public.invitations FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "inv_insert" ON public.invitations FOR INSERT WITH CHECK (public.is_family_owner_or_admin(family_id));
CREATE POLICY "inv_update" ON public.invitations FOR UPDATE USING (auth.uid() = invited_by);
CREATE POLICY "inv_delete" ON public.invitations FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- NOTIFICATIONS
-- =============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "notif_select" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "notif_update" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "notif_insert" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "notif_delete" ON public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ACTIVITIES
-- =============================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "act_select" ON public.activities; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "act_insert" ON public.activities; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "act_select" ON public.activities FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "act_insert" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sub_select" ON public.subscriptions; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "sub_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
