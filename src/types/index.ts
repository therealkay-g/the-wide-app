export type Gender = "male" | "female" | "other" | "unknown";

export type DatePrecision =
  | "EXACT"
  | "YEAR"
  | "MONTH"
  | "APPROXIMATE"
  | "BEFORE"
  | "AFTER"
  | "RANGE"
  | "UNKNOWN";

export type CertaintyLevel =
  | "VERIFIED"
  | "CONFIRMED"
  | "FAMILY_TESTIMONY"
  | "PROBABLE"
  | "HYPOTHESIS"
  | "CONTRADICTORY"
  | "UNKNOWN";

export type RelationshipType =
  | "BIOLOGICAL_PARENT"
  | "ADOPTIVE_PARENT"
  | "STEP_PARENT"
  | "SPOUSE"
  | "FORMER_SPOUSE"
  | "CHILD"
  | "ADOPTED_CHILD"
  | "SIBLING"
  | "HALF_SIBLING"
  | "GRANDPARENT"
  | "GRANDCHILD"
  | "AUNT_UNCLE"
  | "COUSIN"
  | "NEPHEW_NIECE"
  | "IN_LAW";

export type UnionType =
  | "MARRIAGE"
  | "TRADITIONAL_MARRIAGE"
  | "CIVIL_MARRIAGE"
  | "RELIGIOUS_MARRIAGE"
  | "FREE_UNION"
  | "CONCUBINAGE"
  | "SEPARATION"
  | "DIVORCE"
  | "WIDOWHOOD"
  | "OTHER";

export type UnionStatus = "ACTIVE" | "SEPARATED" | "DIVORCED" | "WIDOWED" | "DISSOLVED";

export type MaritalStatus =
  | "SINGLE"
  | "MARRIED"
  | "POLYGAMOUS"
  | "WIDOWED"
  | "DIVORCED"
  | "SEPARATED"
  | "FREE_UNION"
  | "UNKNOWN";

export type AdoptionType =
  | "BIOLOGICAL"
  | "ADOPTED"
  | "LEGAL_GUARDIANSHIP"
  | "FOSTER"
  | "CUSTOMARY"
  | "UNKNOWN";

export type EventType =
  | "BIRTH"
  | "BAPTISM"
  | "MARRIAGE"
  | "DEATH"
  | "RESIDENCE"
  | "MIGRATION"
  | "EDUCATION"
  | "PROFESSION"
  | "MILITARY"
  | "FAMILY_EVENT"
  | "OTHER";

export type SourceType =
  | "CIVIL_REGISTRY"
  | "RELIGIOUS_REGISTRY"
  | "ARCHIVE"
  | "ADMIN_DOCUMENT"
  | "MILITARY_DOCUMENT"
  | "SCHOOL_DOCUMENT"
  | "PHOTOGRAPH"
  | "TESTIMONY"
  | "BOOK"
  | "ARTICLE"
  | "OTHER";

export type FamilyRole = "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";

export type Visibility = "private" | "family" | "public";

export type ResearchStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "NO_RESULT"
  | "ABANDONED";

export type SubscriptionPlan = "FREE" | "STANDARD" | "PREMIUM";

export type NotificationType =
  | "INVITATION"
  | "MODIFICATION"
  | "NEW_DOCUMENT"
  | "NEW_TESTIMONY"
  | "MATCH"
  | "MENTION"
  | "SYSTEM";

export type DocumentCategory =
  | "photo"
  | "document"
  | "audio"
  | "video"
  | "other";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  country: string | null;
  language: string;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  origin_place_id: string | null;
  privacy: Visibility;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
}

export interface Tree {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  tree_id: string;
  family_id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  post_name: string | null;
  nickname: string | null;
  traditional_name: string | null;
  gender: Gender | null;
  profile_photo: string | null;
  birth_date: string | null;
  birth_date_precision: DatePrecision;
  birth_place_id: string | null;
  death_date: string | null;
  death_date_precision: DatePrecision;
  death_place_id: string | null;
  burial_place_id: string | null;
  country: string | null;
  province: string | null;
  city: string | null;
  territory: string | null;
  sector: string | null;
  chiefdom: string | null;
  groupement: string | null;
  village: string | null;
  clan: string | null;
  lineage: string | null;
  family_origin: string | null;
  certainty: CertaintyLevel;
  notes: string | null;
  profession: string | null;
  nationality: string | null;
  biography: string | null;
  phone: string | null;
  email: string | null;
  marital_status: MaritalStatus;
  is_alive: boolean;
  adoption_type: AdoptionType;
  generation: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Union {
  id: string;
  family_id: string;
  person_a_id: string;
  person_b_id: string;
  union_type: UnionType;
  status: UnionStatus;
  start_date: string | null;
  end_date: string | null;
  place: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PersonWithRelations extends Person {
  relationships?: Relationship[];
  unions_as_a?: Union[];
  unions_as_b?: Union[];
  parent_unions?: Union[];
  children?: Person[];
  siblings?: Person[];
}

export interface UnionWithPersons extends Union {
  person_a?: Person;
  person_b?: Person;
  children?: Person[];
}

export interface UnionChildLink {
  union_id: string;
  person_id: string;
}

export interface Relationship {
  id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: RelationshipType;
  certainty: CertaintyLevel;
  union_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  family_id: string;
  name: string;
  country: string | null;
  province: string | null;
  city: string | null;
  territory: string | null;
  sector: string | null;
  chiefdom: string | null;
  groupement: string | null;
  village: string | null;
  former_name: string | null;
  alternative_name: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  historical_period: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  person_id: string;
  family_id: string;
  event_type: EventType;
  date_value: string | null;
  date_precision: DatePrecision;
  place_id: string | null;
  description: string | null;
  source_id: string | null;
  certainty: CertaintyLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  family_id: string;
  title: string;
  type: SourceType;
  author: string | null;
  institution: string | null;
  date: string | null;
  reference_number: string | null;
  url: string | null;
  description: string | null;
  reliability: CertaintyLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  family_id: string;
  owner_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  category: string;
  description: string | null;
  created_at: string;
}

export interface Testimony {
  id: string;
  family_id: string;
  person_id: string | null;
  witness_person_id: string | null;
  witness_name: string | null;
  witness_relation: string | null;
  language: string | null;
  testimony_date: string | null;
  audio_path: string | null;
  transcription: string | null;
  title: string | null;
  description: string | null;
  certainty: CertaintyLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  family_id: string;
  title: string;
  content: string | null;
  author_id: string;
  visibility: Visibility;
  cover_photo: string | null;
  created_at: string;
  updated_at: string;
}

export interface StorySection {
  id: string;
  story_id: string;
  title: string | null;
  content: string | null;
  order_index: number;
  created_at: string;
}

export interface Research {
  id: string;
  family_id: string;
  person_id: string | null;
  question: string;
  hypothesis: string | null;
  period_start: string | null;
  period_end: string | null;
  place: string | null;
  sources_consulted: string | null;
  results: string | null;
  status: ResearchStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MigrationRecord {
  id: string;
  person_id: string;
  family_id: string;
  origin_place: string;
  destination_place: string;
  origin_place_id: string | null;
  destination_place_id: string | null;
  date_start: string | null;
  date_end: string | null;
  reason: string | null;
  source_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  family_id: string;
  email: string;
  role: FamilyRole;
  invited_by: string;
  status: "pending" | "accepted" | "declined" | "expired";
  token: string;
  created_at: string;
  expires_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  family_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
}
