import type { Person, Union, Relationship } from "@/types";

// =============================================
// Types
// =============================================

export type ValidationWarningType =
  | "cycle_detected"
  | "date_inconsistency"
  | "self_reference"
  | "duplicate_union"
  | "orphan_child"
  | "age_inconsistency"
  | "missing_parent"
  /** Data-quality finding that fits no relational category (names, gender, generation...) */
  | "invalid_data";

export interface ValidationWarning {
  type: ValidationWarningType;
  severity: "error" | "warning" | "info";
  message: string;
  personIds?: string[];
  unionId?: string;
}

/** Link between a union and one of its children */
export interface UnionChildLink {
  union_id: string;
  person_id: string;
}

// =============================================
// Constants
// =============================================

const VALID_GENDERS = new Set<string>(["male", "female", "other", "unknown"]);
const MIN_GENERATION = -10;
const MAX_GENERATION = 10;

/** Precisions too vague for reliable chronological comparisons */
const UNRELIABLE_PRECISIONS = new Set<string>(["UNKNOWN"]);

type Color = 0 | 1 | 2; // 0 = unvisited, 1 = in progress, 2 = done
const WHITE: Color = 0;
const GRAY: Color = 1;
const BLACK: Color = 2;

// =============================================
// Internal helpers
// =============================================

/** Display label for a person, falling back to a truncated id */
function personLabel(person: Person | undefined): string {
  if (!person) return "unknown person";
  const name = [person.first_name, person.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
  return name || `#${person.id.slice(0, 8)}`;
}

/** Parse an ISO-ish date string, returning null when absent or unparseable */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Whether a person's date field is precise enough for chronological checks.
 * Unknown precision means the stored value carries no trustworthy meaning.
 */
function hasUsableDate(person: Person, kind: "birth" | "death"): boolean {
  const value = kind === "birth" ? person.birth_date : person.death_date;
  const precision =
    kind === "birth" ? person.birth_date_precision : person.death_date_precision;
  return Boolean(value) && !UNRELIABLE_PRECISIONS.has(precision);
}

/**
 * Map of child id -> set of parent ids, derived from unions and their children.
 * Phantom references (persons that do not exist) are filtered out.
 */
function buildParentMap(
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): Map<string, Set<string>> {
  const personIds = new Set(persons.map((p) => p.id));
  const parentsOf = new Map<string, Set<string>>();

  const addParent = (childId: string, parentId: string) => {
    if (!childId || !parentId || childId === parentId) return;
    if (!personIds.has(childId) || !personIds.has(parentId)) return;
    let set = parentsOf.get(childId);
    if (!set) {
      set = new Set();
      parentsOf.set(childId, set);
    }
    set.add(parentId);
  };

  const membersByUnion = new Map<string, string[]>();
  for (const union of unions) {
    const members = [union.person_a_id, union.person_b_id].filter(
      (id): id is string => Boolean(id) && personIds.has(id)
    );
    membersByUnion.set(union.id, members);
  }

  for (const link of unionChildren ?? []) {
    const members = membersByUnion.get(link.union_id);
    if (!members) continue; // unknown union handled by orphan checks elsewhere
    for (const memberId of members) {
      addParent(link.person_id, memberId);
    }
  }

  return parentsOf;
}

/** Map of parent id -> child ids (descent edges), derived the same way */
function buildChildMap(
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): Map<string, Set<string>> {
  const personIds = new Set(persons.map((p) => p.id));
  const childrenOf = new Map<string, Set<string>>();
  const membersByUnion = new Map<string, string[]>();

  for (const union of unions) {
    const members = [union.person_a_id, union.person_b_id].filter(
      (id): id is string => Boolean(id) && personIds.has(id)
    );
    membersByUnion.set(union.id, members);
  }

  for (const link of unionChildren ?? []) {
    if (!personIds.has(link.person_id)) continue;
    const members = membersByUnion.get(link.union_id);
    if (!members) continue;
    for (const memberId of members) {
      let set = childrenOf.get(memberId);
      if (!set) {
        set = new Set();
        childrenOf.set(memberId, set);
      }
      set.add(link.person_id);
    }
  }

  return childrenOf;
}

function cycleKey(ids: string[]): string {
  return [...ids].sort().join("|");
}

// =============================================
// Cycle detection
// =============================================

/**
 * Detect impossible family cycles, i.e. persons who are their own ancestors,
 * by walking upward through unions and parent links.
 *
 * Also reports persons who are simultaneously parent and child of the same
 * other person (a two-person cycle).
 *
 * Handles empty input gracefully and never follows references to unknown persons.
 */
export function detectCycles(
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (!persons?.length) return warnings;

  const byId = new Map(persons.map((p) => [p.id, p]));
  const parentsOf = buildParentMap(persons, unions ?? [], unionChildren ?? []);
  const emitted = new Set<string>();

  const emit = (nodesInPath: string[], message: string) => {
    const key = cycleKey(nodesInPath);
    if (emitted.has(key)) return;
    emitted.add(key);
    warnings.push({
      type: "cycle_detected",
      severity: "error",
      message,
      personIds: nodesInPath,
    });
  };

  // --- Explicit pass: person both parent and child of the same person ---
  for (const [childId, parents] of parentsOf) {
    for (const parentId of parents) {
      if (parentsOf.get(parentId)?.has(childId)) {
        emit(
          [parentId, childId],
          `${personLabel(byId.get(parentId))} and ${personLabel(
            byId.get(childId)
          )} are recorded as both parent and child of each other`
        );
      }
    }
  }

  // --- Iterative DFS upward through ancestors ---
  const color = new Map<string, Color>(persons.map((p) => [p.id, WHITE as Color]));
  const pathStack: string[] = [];
  const inPath = new Set<string>();

  const neighborsOf = (nodeId: string): string[] =>
    [...(parentsOf.get(nodeId) ?? [])].filter(
      (id) => byId.has(id) && color.get(id) !== BLACK
    );

  for (const person of persons) {
    if (color.get(person.id) !== WHITE) continue;

    const callStack: Array<{ nodeId: string; neighbors: string[]; next: number }> = [
      { nodeId: person.id, neighbors: neighborsOf(person.id), next: 0 },
    ];
    color.set(person.id, GRAY);
    pathStack.push(person.id);
    inPath.add(person.id);

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];

      if (frame.next >= frame.neighbors.length) {
        color.set(frame.nodeId, BLACK);
        pathStack.pop();
        inPath.delete(frame.nodeId);
        callStack.pop();
        continue;
      }

      const nextId = frame.neighbors[frame.next++];
      const state = color.get(nextId);

      if (state === GRAY && inPath.has(nextId)) {
        const startIndex = pathStack.indexOf(nextId);
        const cycleNodes = pathStack.slice(startIndex);
        const labels = cycleNodes.map((id) => personLabel(byId.get(id)));
        emit(
          cycleNodes,
          `Impossible ancestry cycle detected: ${labels.join(" -> ")} -> ${labels[0]}`
        );
      } else if (state === WHITE) {
        color.set(nextId, GRAY);
        pathStack.push(nextId);
        inPath.add(nextId);
        callStack.push({ nodeId: nextId, neighbors: neighborsOf(nextId), next: 0 });
      }
      // BLACK nodes were fully explored and produced no cycle; skip them.
    }
  }

  return warnings;
}

// =============================================
// Single-record validation
// =============================================

/**
 * Validate one person's intrinsic data:
 * - at least one of first_name / last_name present
 * - birth_date before death_date when both are set
 * - gender (when present) belongs to the allowed set
 * - generation within a sane range (-10..+10)
 */
export function validatePerson(person: Person): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (!person) return warnings;

  // Names
  const firstName = person.first_name?.trim() ?? "";
  const lastName = person.last_name?.trim() ?? "";
  if (!firstName && !lastName) {
    warnings.push({
      type: "invalid_data",
      severity: "warning",
      message: `${personLabel(person)} has neither a first name nor a last name`,
      personIds: [person.id],
    });
  }

  // Birth / death order
  if (
    hasUsableDate(person, "birth") &&
    hasUsableDate(person, "death")
  ) {
    const birth = toDate(person.birth_date);
    const death = toDate(person.death_date);
    if (birth && death && birth.getTime() > death.getTime()) {
      warnings.push({
        type: "date_inconsistency",
        severity: "error",
        message: `${personLabel(person)} has a birth date after their death date`,
        personIds: [person.id],
      });
    }
  }

  // Gender
  const gender = person.gender as string | null;
  if (gender !== null && gender !== undefined && !VALID_GENDERS.has(gender)) {
    warnings.push({
      type: "invalid_data",
      severity: "warning",
      message: `${personLabel(person)} has an unrecognized gender value "${gender}"`,
      personIds: [person.id],
    });
  }

  // Generation range
  const generation = person.generation;
  if (
    typeof generation !== "number" ||
    !Number.isFinite(generation) ||
    generation < MIN_GENERATION ||
    generation > MAX_GENERATION
  ) {
    warnings.push({
      type: "invalid_data",
      severity: "warning",
      message: `${personLabel(person)} has an unreasonable generation value (${String(
        generation
      )}); expected between ${MIN_GENERATION} and ${MAX_GENERATION}`,
      personIds: [person.id],
    });
  }

  return warnings;
}

/**
 * Validate one union against the person records it references:
 * - a person cannot be united with themselves
 * - both referenced persons must exist
 * - start_date before end_date when both are set
 * - no duplicate active unions between the same couple
 * - both persons belong to the same family as the union
 */
export function validateUnion(union: Union, persons: Person[]): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (!union) return warnings;

  const byId = new Map((persons ?? []).map((p) => [p.id, p]));
  const personA = byId.get(union.person_a_id);
  const personB = byId.get(union.person_b_id);

  // Self union
  if (union.person_a_id && union.person_a_id === union.person_b_id) {
    warnings.push({
      type: "self_reference",
      severity: "error",
      message: `${personLabel(personA)} is recorded as a partner in their own union`,
      personIds: [union.person_a_id],
      unionId: union.id,
    });
    return warnings; // further checks are meaningless for a self union
  }

  // Referenced persons exist
  for (const [role, id] of [
    ["first", union.person_a_id],
    ["second", union.person_b_id],
  ] as const) {
    const referenced = byId.get(id);
    if (!referenced || !id) {
      warnings.push({
        type: "missing_parent",
        severity: "error",
        message: `Union references an unknown ${role} person (${id ?? "null"})`,
        unionId: union.id,
      });
    }
  }

  // Start / end date order
  const start = toDate(union.start_date);
  const end = toDate(union.end_date);
  if (start && end && start.getTime() > end.getTime()) {
    warnings.push({
      type: "date_inconsistency",
      severity: "error",
      message: `Union between ${personLabel(personA)} and ${personLabel(
        personB
      )} ends before it starts`,
      personIds: [union.person_a_id, union.person_b_id].filter(Boolean),
      unionId: union.id,
    });
  }

  // Family coherence
  if (personA && personA.family_id !== union.family_id) {
    warnings.push({
      type: "invalid_data",
      severity: "warning",
      message: `${personLabel(personA)} does not belong to the same family as their union`,
      personIds: [personA.id],
      unionId: union.id,
    });
  }
  if (personB && personB.family_id !== union.family_id) {
    warnings.push({
      type: "invalid_data",
      severity: "warning",
      message: `${personLabel(personB)} does not belong to the same family as their union`,
      personIds: [personB.id],
      unionId: union.id,
    });
  }

  return warnings;
}

/**
 * Detect couples that share more than one ACTIVE union (duplicates).
 * Exported for reuse; automatically invoked by findInconsistencies.
 */
export function findDuplicateUnions(
  unions: Union[],
  persons: Person[]
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  if (!unions?.length) return warnings;

  const byId = new Map((persons ?? []).map((p) => [p.id, p]));
  const seen = new Map<string, Union>();

  for (const union of unions) {
    if (union.status !== "ACTIVE") continue;
    if (!union.person_a_id || !union.person_b_id) continue;
    if (union.person_a_id === union.person_b_id) continue;
    const key = cycleKey([union.person_a_id, union.person_b_id]);
    const previous = seen.get(key);
    if (previous) {
      const a = byId.get(union.person_a_id);
      const b = byId.get(union.person_b_id);
      warnings.push({
        type: "duplicate_union",
        severity: "warning",
        message: `${personLabel(a)} and ${personLabel(b)} have multiple active unions`,
        personIds: [union.person_a_id, union.person_b_id].filter(Boolean),
        unionId: union.id,
      });
    } else {
      seen.set(key, union);
    }
  }

  return warnings;
}

// =============================================
// Whole-tree consistency sweep
// =============================================

/**
 * Run every consistency check over a full dataset:
 * - ancestry cycles
 * - per-person and per-union validation
 * - duplicate active unions
 * - union_children rows pointing to unknown unions or persons
 * - chronological inconsistencies (child born before parent, after parent's death)
 * - alive/deceased flag contradictions
 * - self-referencing relationships
 */
export function findInconsistencies(
  persons: Person[],
  unions: Union[],
  relationships: Relationship[],
  unionChildren: UnionChildLink[]
): ValidationWarning[] {
  const safePersons = persons ?? [];
  const safeUnions = unions ?? [];
  const safeRelationships = relationships ?? [];
  const safeLinks = unionChildren ?? [];

  const warnings: ValidationWarning[] = [];

  warnings.push(...detectCycles(safePersons, safeUnions, safeLinks));

  for (const person of safePersons) {
    warnings.push(...validatePerson(person));
  }

  for (const union of safeUnions) {
    warnings.push(...validateUnion(union, safePersons));
  }

  warnings.push(...findDuplicateUnions(safeUnions, safePersons));

  const byId = new Map(safePersons.map((p) => [p.id, p]));
  const unionIds = new Set(safeUnions.map((u) => u.id));

  // --- Orphan union_children links ---
  for (const link of safeLinks) {
    if (!link.union_id || !unionIds.has(link.union_id)) {
      warnings.push({
        type: "orphan_child",
        severity: "error",
        message: `Child link references an unknown union (${link.union_id ?? "null"})`,
        personIds: byId.has(link.person_id) ? [link.person_id] : undefined,
      });
    }
    if (!link.person_id || !byId.has(link.person_id)) {
      warnings.push({
        type: "orphan_child",
        severity: "error",
        message: `Child link references an unknown person (${link.person_id ?? "null"})`,
        unionId: unionIds.has(link.union_id) ? link.union_id : undefined,
      });
    }
  }

  // --- Chronology between children and parents ---
  const unionById = new Map(safeUnions.map((u) => [u.id, u]));
  for (const link of safeLinks) {
    const child = byId.get(link.person_id);
    const union = link.union_id ? unionById.get(link.union_id) : undefined;
    if (!child || !union) continue;

    const childBirth =
      hasUsableDate(child, "birth") ? toDate(child.birth_date) : null;
    if (!childBirth) continue;

    for (const parentId of [union.person_a_id, union.person_b_id]) {
      const parent = parentId ? byId.get(parentId) : undefined;
      if (!parent) continue;

      if (hasUsableDate(parent, "birth")) {
        const parentBirth = toDate(parent.birth_date);
        if (parentBirth && parentBirth.getTime() > childBirth.getTime()) {
          warnings.push({
            type: "age_inconsistency",
            severity: "error",
            message: `${personLabel(child)} was born before their parent ${personLabel(
              parent
            )}`,
            personIds: [child.id, parent.id],
            unionId: union.id,
          });
        }
      }

      if (hasUsableDate(parent, "death")) {
        const parentDeath = toDate(parent.death_date);
        if (parentDeath && parentDeath.getTime() < childBirth.getTime()) {
          warnings.push({
            type: "age_inconsistency",
            severity: "warning",
            message: `${personLabel(child)} was born after the recorded death of their parent ${personLabel(
              parent
            )}`,
            personIds: [child.id, parent.id],
            unionId: union.id,
          });
        }
      }
    }
  }

  // --- Alive/deceased contradictions ---
  for (const person of safePersons) {
    if (person.death_date && person.is_alive) {
      warnings.push({
        type: "date_inconsistency",
        severity: "error",
        message: `${personLabel(person)} has a death date but is marked as alive`,
        personIds: [person.id],
      });
    } else if (!person.is_alive && !person.death_date) {
      warnings.push({
        type: "date_inconsistency",
        severity: "info",
        message: `${personLabel(person)} is marked deceased without a death date`,
        personIds: [person.id],
      });
    }
  }

  // --- Completeness: roots without any family ties ---
  const personsWithParents = new Set<string>();
  for (const link of safeLinks) {
    if (link.person_id) personsWithParents.add(link.person_id);
  }
  for (const link of safeLinks) {
    if (link.person_id) personsWithParents.add(link.person_id);
  }
  const involvedInUnion = new Set<string>();
  for (const union of safeUnions) {
    involvedInUnion.add(union.person_a_id);
    involvedInUnion.add(union.person_b_id);
  }
  for (const person of safePersons) {
    if (personsWithParents.has(person.id)) continue;
    if (involvedInUnion.has(person.id)) continue;
    warnings.push({
      type: "missing_parent",
      severity: "warning",
      message: `${personLabel(person)} has no recorded parents and participates in no union`,
      personIds: [person.id],
    });
  }

  // --- Self-referencing relationships ---
  for (const rel of safeRelationships) {
    if (rel.person_id && rel.person_id === rel.related_person_id) {
      warnings.push({
        type: "self_reference",
        severity: "error",
        message: `${personLabel(byId.get(rel.person_id))} has a relationship to themselves (${rel.relationship_type})`,
        personIds: [rel.person_id],
      });
    }
  }

  return warnings;
}

// =============================================
// Predictive cycle check
// =============================================

/**
 * Check whether recording `ancestorId` as an ancestor of `personId`
 * would create an ancestry cycle.
 *
 * Simulates the change by searching downward from `ancestorId` through all
 * descendants; if `personId` already appears among them, linking the two in
 * the requested direction would close a loop.
 *
 * Returns true for degenerate input (a person being their own ancestor).
 */
export function wouldCreateCycle(
  personId: string,
  ancestorId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): boolean {
  if (!personId || !ancestorId) return false;
  if (personId === ancestorId) return true;
  if (!persons?.length) return false;

  const personIds = new Set(persons.map((p) => p.id));
  const childrenOf = buildChildMap(persons, unions ?? [], unionChildren ?? []);

  // BFS downward from the candidate ancestor.
  const visited = new Set<string>([ancestorId]);
  const queue: string[] = [ancestorId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const childId of childrenOf.get(current) ?? []) {
      if (childId === personId) return true;
      if (visited.has(childId) || !personIds.has(childId)) continue;
      visited.add(childId);
      queue.push(childId);
    }
  }

  return false;
}
