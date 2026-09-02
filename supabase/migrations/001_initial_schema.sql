-- WIDE Database Schema (single file, correct order, no recursion)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Ensure anon/authenticated can access future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  country TEXT DEFAULT 'RDC',
  language TEXT DEFAULT 'fr',
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p_sel" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "p_upd" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "p_ins" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- FAMILIES (table only, policies after family_members)
-- =============================================
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  origin_place_id UUID,
  privacy TEXT DEFAULT 'family' CHECK (privacy IN ('private', 'family', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_families_owner ON families(owner_id);

-- =============================================
-- FAMILY MEMBERS (table only, policies after)
-- =============================================
CREATE TABLE family_members (
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'CONTRIBUTOR' CHECK (role IN ('OWNER', 'ADMIN', 'EDITOR', 'CONTRIBUTOR', 'VIEWER')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fm_user ON family_members(user_id);

-- NOW add policies to families (family_members exists)
CREATE POLICY "fam_sel" ON families FOR SELECT USING (
  auth.uid() = owner_id
  OR EXISTS (SELECT 1 FROM family_members WHERE family_members.family_id = id AND family_members.user_id = auth.uid())
);
CREATE POLICY "fam_ins" ON families FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "fam_upd" ON families FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "fam_del" ON families FOR DELETE USING (auth.uid() = owner_id);

-- NOW add policies to family_members (no recursion - uses auth.uid() or families table)
CREATE POLICY "fm_sel" ON family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fm_ins" ON family_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM families WHERE id = family_id AND owner_id = auth.uid())
);
CREATE POLICY "fm_upd" ON family_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM families WHERE id = family_id AND owner_id = auth.uid())
);
CREATE POLICY "fm_del" ON family_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM families WHERE id = family_id AND owner_id = auth.uid())
);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER = bypass RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.is_family_member(family_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_members WHERE family_id = family_uuid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_edit_family(family_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_members WHERE family_id = family_uuid AND user_id = auth.uid() AND role IN ('OWNER','ADMIN','EDITOR','CONTRIBUTOR'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_family_owner_or_admin(family_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.family_members WHERE family_id = family_uuid AND user_id = auth.uid() AND role IN ('OWNER','ADMIN'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PLACES
-- =============================================
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country TEXT, province TEXT, city TEXT,
  territory TEXT, sector TEXT, chiefdom TEXT, groupement TEXT, village TEXT,
  former_name TEXT, alternative_name TEXT,
  latitude DECIMAL(10, 7), longitude DECIMAL(10, 7),
  description TEXT, historical_period TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_places_family ON places(family_id);
CREATE POLICY "pl_sel" ON places FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "pl_ins" ON places FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "pl_upd" ON places FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "pl_del" ON places FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- TREES
-- =============================================
CREATE TABLE trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('private', 'family', 'public')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_trees_family ON trees(family_id);
CREATE POLICY "tr_sel" ON trees FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "tr_ins" ON trees FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "tr_upd" ON trees FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "tr_del" ON trees FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- PERSONS
-- =============================================
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name TEXT, middle_name TEXT, last_name TEXT, post_name TEXT,
  nickname TEXT, traditional_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  profile_photo TEXT,
  birth_date TEXT,
  birth_date_precision TEXT DEFAULT 'UNKNOWN' CHECK (birth_date_precision IN ('EXACT','YEAR','MONTH','APPROXIMATE','BEFORE','AFTER','RANGE','UNKNOWN')),
  birth_place_id UUID REFERENCES places(id),
  death_date TEXT,
  death_date_precision TEXT DEFAULT 'UNKNOWN' CHECK (death_date_precision IN ('EXACT','YEAR','MONTH','APPROXIMATE','BEFORE','AFTER','RANGE','UNKNOWN')),
  death_place_id UUID REFERENCES places(id),
  burial_place_id UUID REFERENCES places(id),
  country TEXT, province TEXT, city TEXT, territory TEXT, sector TEXT,
  chiefdom TEXT, groupement TEXT, village TEXT,
  clan TEXT, lineage TEXT, family_origin TEXT, notes TEXT,
  certainty TEXT DEFAULT 'UNKNOWN' CHECK (certainty IN ('VERIFIED','CONFIRMED','FAMILY_TESTIMONY','PROBABLE','HYPOTHESIS','CONTRADICTORY','UNKNOWN')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_persons_tree ON persons(tree_id);
CREATE INDEX idx_persons_family ON persons(family_id);
CREATE INDEX idx_persons_lname ON persons(last_name);
CREATE POLICY "per_sel" ON persons FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "per_ins" ON persons FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "per_upd" ON persons FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "per_del" ON persons FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- RELATIONSHIPS
-- =============================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  related_person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'BIOLOGICAL_PARENT','ADOPTIVE_PARENT','STEP_PARENT',
    'SPOUSE','FORMER_SPOUSE','CHILD','ADOPTED_CHILD','SIBLING','HALF_SIBLING'
  )),
  certainty TEXT DEFAULT 'UNKNOWN',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (person_id != related_person_id)
);
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_rels_person ON relationships(person_id);
CREATE POLICY "rel_sel" ON relationships FOR SELECT USING (
  EXISTS (SELECT 1 FROM persons p WHERE p.id = person_id AND public.is_family_member(p.family_id))
);
CREATE POLICY "rel_ins" ON relationships FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);
CREATE POLICY "rel_upd" ON relationships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);
CREATE POLICY "rel_del" ON relationships FOR DELETE USING (
  EXISTS (SELECT 1 FROM persons p WHERE p.id = person_id AND public.can_edit_family(p.family_id))
);

-- =============================================
-- EVENTS
-- =============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'BIRTH','BAPTISM','MARRIAGE','DEATH','RESIDENCE','MIGRATION',
    'EDUCATION','PROFESSION','MILITARY','FAMILY_EVENT','OTHER'
  )),
  date_value TEXT,
  date_precision TEXT DEFAULT 'UNKNOWN',
  place_id UUID REFERENCES places(id),
  description TEXT,
  source_id UUID,
  certainty TEXT DEFAULT 'UNKNOWN',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_events_person ON events(person_id);
CREATE INDEX idx_events_family ON events(family_id);
CREATE POLICY "ev_sel" ON events FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "ev_ins" ON events FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "ev_upd" ON events FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "ev_del" ON events FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- SOURCES
-- =============================================
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'CIVIL_REGISTRY','RELIGIOUS_REGISTRY','ARCHIVE','ADMIN_DOCUMENT',
    'MILITARY_DOCUMENT','SCHOOL_DOCUMENT','PHOTOGRAPH','TESTIMONY','BOOK','ARTICLE','OTHER'
  )),
  author TEXT, institution TEXT, date TEXT, reference_number TEXT,
  url TEXT, description TEXT, reliability TEXT DEFAULT 'UNKNOWN',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sources_family ON sources(family_id);
CREATE POLICY "src_sel" ON sources FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "src_ins" ON sources FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "src_upd" ON sources FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "src_del" ON sources FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- DOCUMENTS
-- =============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT DEFAULT 'other',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_docs_family ON documents(family_id);
CREATE POLICY "doc_sel" ON documents FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "doc_ins" ON documents FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "doc_del" ON documents FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- DOCUMENT PERSONS
-- =============================================
CREATE TABLE document_persons (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  relation_type TEXT,
  PRIMARY KEY (document_id, person_id)
);
ALTER TABLE document_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dp_sel" ON document_persons FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND public.is_family_member(d.family_id))
);
CREATE POLICY "dp_ins" ON document_persons FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND public.can_edit_family(d.family_id))
);
CREATE POLICY "dp_del" ON document_persons FOR DELETE USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND public.can_edit_family(d.family_id))
);

-- =============================================
-- TESTIMONIES
-- =============================================
CREATE TABLE testimonies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  witness_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  witness_name TEXT, witness_relation TEXT, language TEXT,
  testimony_date TEXT, audio_path TEXT, transcription TEXT,
  title TEXT, description TEXT,
  certainty TEXT DEFAULT 'FAMILY_TESTIMONY',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_test_family ON testimonies(family_id);
CREATE POLICY "tes_sel" ON testimonies FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "tes_ins" ON testimonies FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "tes_upd" ON testimonies FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "tes_del" ON testimonies FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- STORIES
-- =============================================
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('private', 'family', 'public')),
  cover_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stories_family ON stories(family_id);
CREATE POLICY "st_sel" ON stories FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "st_ins" ON stories FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "st_upd" ON stories FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "st_del" ON stories FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- RESEARCHES
-- =============================================
CREATE TABLE researches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  hypothesis TEXT, period_start TEXT, period_end TEXT,
  place TEXT, sources_consulted TEXT, results TEXT,
  status TEXT DEFAULT 'TODO' CHECK (status IN ('TODO','IN_PROGRESS','RESOLVED','NO_RESULT','ABANDONED')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_res_family ON researches(family_id);
CREATE POLICY "res_sel" ON researches FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "res_ins" ON researches FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "res_upd" ON researches FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "res_del" ON researches FOR DELETE USING (auth.uid() = created_by);

-- =============================================
-- FAMILY MIGRATIONS
-- =============================================
CREATE TABLE family_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  origin_place TEXT NOT NULL, destination_place TEXT NOT NULL,
  origin_place_id UUID REFERENCES places(id),
  destination_place_id UUID REFERENCES places(id),
  date_start TEXT, date_end TEXT, reason TEXT,
  source_id UUID REFERENCES sources(id), notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE family_migrations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mig_family ON family_migrations(family_id);
CREATE POLICY "mig_sel" ON family_migrations FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "mig_ins" ON family_migrations FOR INSERT WITH CHECK (public.can_edit_family(family_id));
CREATE POLICY "mig_upd" ON family_migrations FOR UPDATE USING (public.can_edit_family(family_id));
CREATE POLICY "mig_del" ON family_migrations FOR DELETE USING (public.can_edit_family(family_id));

-- =============================================
-- INVITATIONS
-- =============================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'CONTRIBUTOR' CHECK (role IN ('ADMIN','EDITOR','CONTRIBUTOR','VIEWER')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_sel" ON invitations FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "inv_ins" ON invitations FOR INSERT WITH CHECK (public.is_family_owner_or_admin(family_id));
CREATE POLICY "inv_upd" ON invitations FOR UPDATE USING (auth.uid() = invited_by);
CREATE POLICY "inv_del" ON invitations FOR DELETE USING (public.is_family_owner_or_admin(family_id));

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
  link TEXT, read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "not_sel" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "not_upd" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "not_ins" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "not_del" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ACTIVITIES
-- =============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, entity_type TEXT NOT NULL,
  entity_id UUID, entity_name TEXT, details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "act_sel" ON activities FOR SELECT USING (public.is_family_member(family_id));
CREATE POLICY "act_ins" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE','STANDARD','PREMIUM')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_sel" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'FREE', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_subscription();

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS upd_profiles ON profiles;
CREATE TRIGGER upd_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_families ON families;
CREATE TRIGGER upd_families BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_trees ON trees;
CREATE TRIGGER upd_trees BEFORE UPDATE ON trees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_persons ON persons;
CREATE TRIGGER upd_persons BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_rels ON relationships;
CREATE TRIGGER upd_rels BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_events ON events;
CREATE TRIGGER upd_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_places ON places;
CREATE TRIGGER upd_places BEFORE UPDATE ON places FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_sources ON sources;
CREATE TRIGGER upd_sources BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_test ON testimonies;
CREATE TRIGGER upd_test BEFORE UPDATE ON testimonies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_stories ON stories;
CREATE TRIGGER upd_stories BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_res ON researches;
CREATE TRIGGER upd_res BEFORE UPDATE ON researches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_mig ON family_migrations;
CREATE TRIGGER upd_mig BEFORE UPDATE ON family_migrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS upd_sub ON subscriptions;
CREATE TRIGGER upd_sub BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ENSURE PROFILES EXIST FOR ALL AUTH USERS
-- =============================================
INSERT INTO public.profiles (id, first_name, last_name)
SELECT id, COALESCE(raw_user_meta_data->>'first_name', ''), COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EXPLICIT GRANTS (ensure anon/authenticated have access)
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
