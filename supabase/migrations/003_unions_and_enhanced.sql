-- =============================================
-- WIDE Migration 003: Unions & Enhanced Persons
-- Support for African polygamous families
-- Adds: unions, union_children tables + enhanced persons/relationships columns
-- Idempotent: safe to run multiple times
-- =============================================

-- =============================================
-- NEW TABLE: UNIONS
-- Represents a union between two persons
-- (marriage, traditional marriage, free union, etc.)
-- Supports polygamy: one person can appear in many ACTIVE unions
-- =============================================
CREATE TABLE IF NOT EXISTS public.unions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  person_a_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  person_b_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  union_type TEXT NOT NULL DEFAULT 'MARRIAGE' CHECK (union_type IN (
    'MARRIAGE', 'TRADITIONAL_MARRIAGE', 'CIVIL_MARRIAGE', 'RELIGIOUS_MARRIAGE',
    'FREE_UNION', 'CONCUBINAGE', 'SEPARATION', 'DIVORCE', 'WIDOWHOOD', 'OTHER'
  )),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
    'ACTIVE', 'SEPARATED', 'DIVORCED', 'WIDOWED', 'DISSOLVED'
  )),
  start_date TEXT,
  end_date TEXT,
  place TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent a person being unioned with themselves
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unions_no_self_union'
  ) THEN
    ALTER TABLE public.unions ADD CONSTRAINT unions_no_self_union CHECK (person_a_id <> person_b_id);
  END IF;
END $$;

-- =============================================
-- NEW TABLE: UNION CHILDREN
-- Links children to a specific union (not just individual parents).
-- Essential for polygamous families: a child belongs to ONE union,
-- not to every spouse of a parent.
-- =============================================
CREATE TABLE IF NOT EXISTS public.union_children (
  union_id UUID NOT NULL REFERENCES public.unions(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  PRIMARY KEY (union_id, person_id)
);

-- =============================================
-- ALTER PERSONS: add missing columns
-- =============================================
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS biography TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'UNKNOWN' CHECK (marital_status IN (
  'SINGLE', 'MARRIED', 'POLYGAMOUS', 'WIDOWED', 'DIVORCED', 'SEPARATED', 'FREE_UNION', 'UNKNOWN'
));
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS is_alive BOOLEAN DEFAULT TRUE;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS adoption_type TEXT CHECK (adoption_type IN (
  'BIOLOGICAL', 'ADOPTED', 'LEGAL_GUARDIANSHIP', 'FOSTER', 'CUSTOMARY', 'UNKNOWN'
));
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS generation INTEGER DEFAULT 0;

-- =============================================
-- ALTER RELATIONSHIPS: optional link to a union
-- (e.g. SPOUSE relationship pointing to the specific union)
-- =============================================
ALTER TABLE public.relationships ADD COLUMN IF NOT EXISTS union_id UUID REFERENCES public.unions(id) ON DELETE SET NULL;

-- =============================================
-- RELATIONSHIP TYPES NOTE
-- relationships.relationship_type remains TEXT (no schema change needed).
-- Extended types now recognized by the app layer:
--   BIOLOGICAL_PARENT, ADOPTIVE_PARENT, STEP_PARENT, SPOUSE, FORMER_SPOUSE,
--   CHILD, ADOPTED_CHILD, SIBLING, HALF_SIBLING,
--   GRANDPARENT, GRANDCHILD, AUNT_UNCLE, COUSIN, NEPHEW_NIECE, IN_LAW
-- =============================================
COMMENT ON TABLE public.relationships IS 'Person-to-person relationships. relationship_type is TEXT; extended types include GRANDPARENT, GRANDCHILD, AUNT_UNCLE, COUSIN, NEPHEW_NIECE, IN_LAW. Optional union_id links spouse/child relations to a specific union.';

COMMENT ON TABLE public.unions IS 'Unions between two persons. Supports polygamy: one person may appear as person_a or person_b in multiple unions with status ACTIVE.';
COMMENT ON TABLE public.union_children IS 'Children born of / attached to a specific union. In polygamous families this disambiguates which mother/wife a child belongs to.';

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_unions_family ON public.unions(family_id);
CREATE INDEX IF NOT EXISTS idx_unions_person_a ON public.unions(person_a_id);
CREATE INDEX IF NOT EXISTS idx_unions_person_b ON public.unions(person_b_id);
CREATE INDEX IF NOT EXISTS idx_unions_status ON public.unions(status);
CREATE INDEX IF NOT EXISTS idx_union_children_union ON public.union_children(union_id);
CREATE INDEX IF NOT EXISTS idx_union_children_person ON public.union_children(person_id);
CREATE INDEX IF NOT EXISTS idx_persons_profession ON public.persons(profession);
CREATE INDEX IF NOT EXISTS idx_persons_marital_status ON public.persons(marital_status);
CREATE INDEX IF NOT EXISTS idx_persons_generation ON public.persons(generation);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.union_children ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (idempotent)
DO $$ BEGIN DROP POLICY IF EXISTS "unions_select" ON public.unions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "unions_insert" ON public.unions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "unions_update" ON public.unions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "unions_delete" ON public.unions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "uc_select" ON public.union_children; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "uc_insert" ON public.union_children; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "uc_update" ON public.union_children; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "uc_delete" ON public.union_children; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- UNIONS: family members can read, editors can write
CREATE POLICY "unions_select" ON public.unions FOR SELECT USING (
  public.is_family_member(family_id)
);
CREATE POLICY "unions_insert" ON public.unions FOR INSERT WITH CHECK (
  public.can_edit_family(family_id) AND auth.uid() = created_by
);
CREATE POLICY "unions_update" ON public.unions FOR UPDATE USING (
  public.can_edit_family(family_id)
);
CREATE POLICY "unions_delete" ON public.unions FOR DELETE USING (
  public.can_edit_family(family_id)
);

-- UNION CHILDREN: access inherited from the parent union's family
CREATE POLICY "uc_select" ON public.union_children FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.unions u
    WHERE u.id = union_id AND public.is_family_member(u.family_id)
  )
);
CREATE POLICY "uc_insert" ON public.union_children FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.unions u
    WHERE u.id = union_id AND public.can_edit_family(u.family_id)
  )
);
CREATE POLICY "uc_update" ON public.union_children FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.unions u
    WHERE u.id = union_id AND public.can_edit_family(u.family_id)
  )
);
CREATE POLICY "uc_delete" ON public.union_children FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.unions u
    WHERE u.id = union_id AND public.can_edit_family(u.family_id)
  )
);

-- =============================================
-- UPDATED_AT TRIGGERS (reuses update_updated_at() from migration 001)
-- =============================================
DROP TRIGGER IF EXISTS upd_unions ON public.unions;
CREATE TRIGGER upd_unions BEFORE UPDATE ON public.unions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- GRANTS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.union_children TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
