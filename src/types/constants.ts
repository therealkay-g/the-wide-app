export const DATE_PRECISION_LABELS: Record<string, string> = {
  EXACT: "Exacte",
  YEAR: "Année",
  MONTH: "Mois",
  APPROXIMATE: "Approximative",
  BEFORE: "Avant",
  AFTER: "Après",
  RANGE: "Période",
  UNKNOWN: "Inconnue",
};

export const CERTAINTY_LABELS: Record<string, string> = {
  VERIFIED: "Vérifié",
  CONFIRMED: "Confirmé",
  FAMILY_TESTIMONY: "Témoignage familial",
  PROBABLE: "Probable",
  HYPOTHESIS: "Hypothèse",
  CONTRADICTORY: "Contradictoire",
  UNKNOWN: "Inconnu",
};

export const CERTAINTY_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-800 border-green-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  FAMILY_TESTIMONY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROBABLE: "bg-orange-100 text-orange-800 border-orange-200",
  HYPOTHESIS: "bg-purple-100 text-purple-800 border-purple-200",
  CONTRADICTORY: "bg-red-100 text-red-800 border-red-200",
  UNKNOWN: "bg-gray-100 text-gray-800 border-gray-200",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  BIOLOGICAL_PARENT: "Parent biologique",
  ADOPTIVE_PARENT: "Parent adoptif",
  STEP_PARENT: "Beau-parent",
  SPOUSE: "Conjoint(e)",
  FORMER_SPOUSE: "Ex-conjoint(e)",
  CHILD: "Enfant",
  ADOPTED_CHILD: "Enfant adoptif",
  SIBLING: "Frère/Sœur",
  HALF_SIBLING: "Demi-frère/Sœur",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRTH: "Naissance",
  BAPTISM: "Baptême",
  MARRIAGE: "Mariage",
  DEATH: "Décès",
  RESIDENCE: "Résidence",
  MIGRATION: "Migration",
  EDUCATION: "Études",
  PROFESSION: "Profession",
  MILITARY: "Service militaire",
  FAMILY_EVENT: "Événement familial",
  OTHER: "Autre",
};

export const EVENT_TYPE_ICONS: Record<string, string> = {
  BIRTH: "baby",
  BAPTISM: "droplets",
  MARRIAGE: "heart",
  DEATH: "skull",
  RESIDENCE: "home",
  MIGRATION: "map-pin",
  EDUCATION: "graduation-cap",
  PROFESSION: "briefcase",
  MILITARY: "shield",
  FAMILY_EVENT: "users",
  OTHER: "star",
};

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  CIVIL_REGISTRY: "État civil",
  RELIGIOUS_REGISTRY: "Registre religieux",
  ARCHIVE: "Archive",
  ADMINISTRATIVE_DOCUMENT: "Document administratif",
  MILITARY_DOCUMENT: "Document militaire",
  SCHOOL_DOCUMENT: "Document scolaire",
  PHOTOGRAPH: "Photographie",
  TESTIMONY: "Témoignage",
  BOOK: "Livre",
  ARTICLE: "Article",
  OTHER: "Autre",
};

export const FAMILY_ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  CONTRIBUTOR: "Contributeur",
  VIEWER: "Lecteur",
};

export const FAMILY_ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-800",
  ADMIN: "bg-red-100 text-red-800",
  EDITOR: "bg-blue-100 text-blue-800",
  CONTRIBUTOR: "bg-green-100 text-green-800",
  VIEWER: "bg-gray-100 text-gray-800",
};

export const RESEARCH_STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  NO_RESULT: "Sans résultat",
  ABANDONED: "Abandonné",
};

export const RESEARCH_STATUS_COLORS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  NO_RESULT: "bg-orange-100 text-orange-800",
  ABANDONED: "bg-red-100 text-red-800",
};
