import type { Person, Union } from "@/types";

// =============================================
// Constants
// =============================================
export const PERSON_NODE_WIDTH = 180;
export const PERSON_NODE_HEIGHT = 120;
export const UNION_NODE_WIDTH = 40;
export const UNION_NODE_HEIGHT = 40;
export const HORIZONTAL_SPACING = 60;
export const VERTICAL_SPACING = 120;
export const GENERATION_HEIGHT = 200;

/** Gap between a person and its union node inside a couple segment */
const COUPLE_GAP = 28;
/** Gap between distinct unions of the same person (polygamy) */
const FAMILY_GAP = HORIZONTAL_SPACING;
/** Gap between disconnected family clusters */
const CLUSTER_GAP = HORIZONTAL_SPACING * 2;

// =============================================
// Public interfaces
// =============================================
export interface LayoutNode {
  id: string;
  type: "person" | "union";
  personId?: string;
  unionId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: Person | Union;
}

export interface LayoutEdge {
  from: string; // node id
  to: string; // node id
  type: "parent_child" | "union_member" | "union_child";
}

export interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

export interface UnionChildLink {
  union_id: string;
  person_id: string;
}

export interface TreeLayoutOptions {
  maxGenerations?: number;
  showPaternal?: boolean;
  showMaternal?: boolean;
  direction?: "descendants" | "ancestors" | "both";
  /** Person ids whose descendant branches are collapsed */
  collapsedPersonIds?: string[];
}

// =============================================
// Graph helpers
// =============================================

/** Unions where the person is a member (as person_a or person_b) */
export function findUnions(personId: string, unions: Union[]): Union[] {
  return unions.filter(
    (u) => u.person_a_id === personId || u.person_b_id === personId
  );
}

/** Unions through which the person is a child */
export function findParentUnions(
  personId: string,
  unions: Union[],
  unionChildren: UnionChildLink[]
): Union[] {
  const unionIds = new Set(
    unionChildren.filter((l) => l.person_id === personId).map((l) => l.union_id)
  );
  return unions.filter((u) => unionIds.has(u.id));
}

/** Children of a person across all their unions */
export function findChildren(
  personId: string,
  unions: Union[],
  unionChildren: UnionChildLink[],
  persons: Person[]
): Person[] {
  const myUnionIds = new Set(findUnions(personId, unions).map((u) => u.id));
  const childIds = new Set(
    unionChildren
      .filter((l) => myUnionIds.has(l.union_id))
      .map((l) => l.person_id)
  );
  return persons.filter((p) => childIds.has(p.id));
}

function otherMember(union: Union, personId: string): string | null {
  if (union.person_a_id === personId) return union.person_b_id;
  if (union.person_b_id === personId) return union.person_a_id;
  return null;
}

// =============================================
// Internal graph index
// =============================================
interface GraphIndex {
  personMap: Map<string, Person>;
  unionMap: Map<string, Union>;
  /** person -> union ids, ordered by start date then creation */
  unionsOfPerson: Map<string, string[]>;
  /** union id -> ordered child person ids */
  childrenOfUnion: Map<string, string[]>;
  /** person -> parent union ids */
  parentUnionsOf: Map<string, string[]>;
}

function buildIndex(
  persons: Person[],
  unions: Union[],
  links: UnionChildLink[]
): GraphIndex {
  const personMap = new Map<string, Person>();
  for (const p of persons) personMap.set(p.id, p);

  const unionMap = new Map<string, Union>();
  for (const u of unions) {
    // Only keep unions whose two members exist in the dataset
    if (personMap.has(u.person_a_id) && personMap.has(u.person_b_id)) {
      unionMap.set(u.id, u);
    }
  }

  const childrenOfUnion = new Map<string, string[]>();
  for (const link of links) {
    if (!unionMap.has(link.union_id)) continue;
    if (!personMap.has(link.person_id)) continue;
    const list = childrenOfUnion.get(link.union_id) ?? [];
    if (!list.includes(link.person_id)) list.push(link.person_id);
    childrenOfUnion.set(link.union_id, list);
  }

  const sortKey = (u: Union) => `${u.start_date ?? "9999"}|${u.created_at ?? ""}`;
  const unionsOfPerson = new Map<string, string[]>();
  const sortedUnions = [...unionMap.values()].sort((a, b) =>
    sortKey(a).localeCompare(sortKey(b))
  );
  for (const u of sortedUnions) {
    for (const pid of [u.person_a_id, u.person_b_id]) {
      const list = unionsOfPerson.get(pid) ?? [];
      list.push(u.id);
      unionsOfPerson.set(pid, list);
    }
  }

  const parentUnionsOf = new Map<string, string[]>();
  for (const [unionId, childIds] of childrenOfUnion) {
    for (const childId of childIds) {
      const list = parentUnionsOf.get(childId) ?? [];
      if (!list.includes(unionId)) list.push(unionId);
      parentUnionsOf.set(childId, list);
    }
  }

  return {
    personMap,
    unionMap,
    unionsOfPerson,
    childrenOfUnion,
    parentUnionsOf,
  };
}

// =============================================
// Inclusion set (direction / branch filtering)
// =============================================

/**
 * Compute which persons are included in the layout based on focus,
 * direction and paternal/maternal branch options.
 * Returns null when everything should be included.
 */
function computeIncludedPersons(
  index: GraphIndex,
  focusPersonId: string | undefined,
  options: TreeLayoutOptions
): Set<string> | null {
  const { direction = "both", showPaternal = true, showMaternal = true } =
    options;

  if (!focusPersonId || !index.personMap.has(focusPersonId)) {
    return null; // full tree
  }

  const included = new Set<string>([focusPersonId]);

  /** All descendants of a person through their unions */
  const addDescendants = (rootId: string) => {
    const queue = [rootId];
    while (queue.length > 0) {
      const pid = queue.shift()!;
      for (const uid of index.unionsOfPerson.get(pid) ?? []) {
        for (const childId of index.childrenOfUnion.get(uid) ?? []) {
          if (!included.has(childId)) {
            included.add(childId);
            queue.push(childId);
          }
        }
      }
    }
  };

  /**
   * Climb up from a person through parent unions. When `genderFilter`
   * is set, only parents matching that gender continue the climb
   * (male = paternal line, female = maternal line).
   * Returns the set of ancestors found.
   */
  const collectAncestors = (
    startId: string,
    genderFilter?: "male" | "female"
  ): Set<string> => {
    const ancestors = new Set<string>([startId]);
    const queue = [startId];
    while (queue.length > 0) {
      const pid = queue.shift()!;
      for (const uid of index.parentUnionsOf.get(pid) ?? []) {
        const union = index.unionMap.get(uid);
        if (!union) continue;
        for (const memberId of [union.person_a_id, union.person_b_id]) {
          if (ancestors.has(memberId)) continue;
          if (genderFilter) {
            const member = index.personMap.get(memberId);
            if (!member || member.gender !== genderFilter) continue;
          }
          ancestors.add(memberId);
          queue.push(memberId);
        }
      }
    }
    return ancestors;
  };

  switch (direction) {
    case "descendants": {
      addDescendants(focusPersonId);
      break;
    }
    case "ancestors": {
      // Direct ancestral chain only (couples included, no siblings)
      const ancestors = collectAncestors(focusPersonId);
      for (const a of ancestors) included.add(a);
      break;
    }
    default: {
      // both: ancestor branches (with their full descent) + focus subtree
      if (!showPaternal && !showMaternal) {
        addDescendants(focusPersonId);
        break;
      }
      const branches: Set<string>[] = [];
      if (showPaternal) branches.push(collectAncestors(focusPersonId, "male"));
      if (showMaternal) branches.push(collectAncestors(focusPersonId, "female"));

      if (branches.length === 0) {
        addDescendants(focusPersonId);
        break;
      }

      for (const branch of branches) {
        for (const ancestorId of branch) {
          included.add(ancestorId);
          // Whole branch descending from this ancestor
          const subtree = new Set<string>([ancestorId]);
          const queue = [ancestorId];
          while (queue.length > 0) {
            const pid = queue.shift()!;
            for (const uid of index.unionsOfPerson.get(pid) ?? []) {
              const union = index.unionMap.get(uid);
              if (!union) continue;
              for (const memberId of [union.person_a_id, union.person_b_id]) {
                if (!subtree.has(memberId)) {
                  subtree.add(memberId);
                  queue.push(memberId);
                }
              }
              for (const childId of index.childrenOfUnion.get(uid) ?? []) {
                if (!subtree.has(childId)) {
                  subtree.add(childId);
                  queue.push(childId);
                }
              }
            }
          }
          for (const s of subtree) included.add(s);
        }
      }
      break;
    }
  }

  return included.size > 0 ? included : null;
}

// =============================================
// Generation assignment (fixpoint relaxation)
// =============================================
/**
 * Rules:
 *  - spouses share the same generation
 *  - children sit one generation below their union members
 *  - union members sit one generation above their children
 */
function assignGenerations(
  index: GraphIndex,
  seeds: { personId: string; gen: number }[]
): Map<string, number> {
  const gens = new Map<string, number>();
  for (const { personId, gen } of seeds) {
    const existing = gens.get(personId);
    if (existing === undefined || gen < existing) gens.set(personId, gen);
  }

  const MAX_ITERATIONS = 64;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let changed = false;
    const snapshot = [...gens.entries()];

    for (const [pid, gen] of snapshot) {
      // Spouses share generation
      for (const uid of index.unionsOfPerson.get(pid) ?? []) {
        const union = index.unionMap.get(uid);
        if (!union) continue;
        for (const memberId of [union.person_a_id, union.person_b_id]) {
          if (memberId === pid) continue;
          const current = gens.get(memberId);
          if (current === undefined || current > gen) {
            gens.set(memberId, gen);
            changed = true;
          }
        }
      }

      // Children one below
      for (const uid of index.unionsOfPerson.get(pid) ?? []) {
        for (const childId of index.childrenOfUnion.get(uid) ?? []) {
          const target = gen + 1;
          const current = gens.get(childId);
          if (current === undefined || current > target) {
            gens.set(childId, target);
            changed = true;
          }
        }
      }

      // Parents one above
      for (const uid of index.parentUnionsOf.get(pid) ?? []) {
        const union = index.unionMap.get(uid);
        if (!union) continue;
        const target = gen - 1;
        for (const memberId of [union.person_a_id, union.person_b_id]) {
          const current = gens.get(memberId);
          if (current === undefined || current < target) {
            gens.set(memberId, target);
            changed = true;
          }
        }
      }
    }

    if (!changed) break;
  }

  return gens;
}

// =============================================
// Main layout
// =============================================
export function calculateTreeLayout(
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[],
  focusPersonId?: string,
  options: TreeLayoutOptions = {}
): TreeLayout {
  const emptyLayout: TreeLayout = {
    nodes: [],
    edges: [],
    width: 0,
    height: 0,
    bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  };

  if (persons.length === 0) return emptyLayout;

  const fullIndex = buildIndex(persons, unions, unionChildren);

  // ---------------------------------------------
  // 1. Determine the set of included persons
  // ---------------------------------------------
  const inclusion = computeIncludedPersons(fullIndex, focusPersonId, options);

  const scopedPersons = inclusion
    ? persons.filter((p) => inclusion.has(p.id))
    : persons;
  if (scopedPersons.length === 0) return emptyLayout;

  const index = buildIndex(
    scopedPersons,
    unions.filter((u) =>
      inclusion ? inclusion.has(u.person_a_id) && inclusion.has(u.person_b_id) : true
    ),
    unionChildren.filter((l) => (inclusion ? inclusion.has(l.person_id) : true))
  );

  const collapsed = new Set(options.collapsedPersonIds ?? []);

  // ---------------------------------------------
  // 2. Assign generations
  // ---------------------------------------------
  const seeds: { personId: string; gen: number }[] = [];

  if (focusPersonId && index.personMap.has(focusPersonId)) {
    seeds.push({ personId: focusPersonId, gen: 0 });
  } else {
    // Roots = persons without a resolvable parent union in scope
    for (const pid of index.personMap.keys()) {
      const parentUnions = (index.parentUnionsOf.get(pid) ?? []).filter((uid) =>
        index.unionMap.has(uid)
      );
      if (parentUnions.length === 0) {
        seeds.push({ personId: pid, gen: 0 });
      }
    }
    if (seeds.length === 0) {
      seeds.push({ personId: [...index.personMap.keys()][0], gen: 0 });
    }
  }

  const generations = assignGenerations(index, seeds);
  const minGen = generations.size
    ? Math.min(...generations.values())
    : 0;
  const maxGenAllowed =
    minGen +
    (options.maxGenerations && options.maxGenerations > 0
      ? options.maxGenerations - 1
      : Number.MAX_SAFE_INTEGER);

  for (const [pid, gen] of [...generations.entries()]) {
    if (gen > maxGenAllowed) generations.delete(pid);
  }

  // ---------------------------------------------
  // 3. Measure & place clusters (top-down, tidy-ish)
  // ---------------------------------------------
  const yForGen = (gen: number) => (gen - minGen) * GENERATION_HEIGHT;
  const bandForGen = (gen: number) =>
    yForGen(gen) +
    PERSON_NODE_HEIGHT +
    (GENERATION_HEIGHT - PERSON_NODE_HEIGHT - UNION_NODE_HEIGHT) / 2;

  interface ClusterInfo {
    blockWidth: number;
    spouseId: string | null;
    anchorId: string;
  }

  const placedPersons = new Map<string, { x: number; gen: number }>();
  const placedUnions = new Map<string, { x: number; y: number; anchorId: string }>();
  const visitedUnions = new Set<string>();
  const visitedPersons = new Set<string>();
  const subtreeWidths = new Map<string, number>();
  const clusterInfo = new Map<string, ClusterInfo>();

  /**
   * Measures the horizontal extent of the cluster rooted at personId.
   * A cluster = the person + every union they anchor (with spouses)
   * + the recursive clusters of all those unions' children.
   */
  function measure(personId: string): number {
    visitedPersons.add(personId);
    let width = PERSON_NODE_WIDTH;

    for (const uid of index.unionsOfPerson.get(personId) ?? []) {
      if (visitedUnions.has(uid)) continue;
      const union = index.unionMap.get(uid);
      if (!union) continue;
      visitedUnions.add(uid);

      const spouseId = otherMember(union, personId);

      // Couple segment: anchor(placed) + gap + diamond (+ gap + spouse)
      let segmentWidth = PERSON_NODE_WIDTH + COUPLE_GAP + UNION_NODE_WIDTH;
      if (
        spouseId &&
        !visitedPersons.has(spouseId) &&
        !collapsed.has(personId)
      ) {
        visitedPersons.add(spouseId);
        segmentWidth += COUPLE_GAP + PERSON_NODE_WIDTH;
      }

      // Children subtrees
      let childrenTotal = 0;
      let childCount = 0;
      const childIds = collapsed.has(personId)
        ? []
        : index.childrenOfUnion.get(uid) ?? [];
      for (const childId of childIds) {
        if (visitedPersons.has(childId)) continue; // shared child, placed once
        const w = measure(childId);
        subtreeWidths.set(childId, w);
        childrenTotal += w;
        childCount++;
      }
      childrenTotal += Math.max(0, childCount - 1) * HORIZONTAL_SPACING;

      const blockWidth = Math.max(segmentWidth, childrenTotal);
      clusterInfo.set(uid, { blockWidth, spouseId, anchorId: personId });
      width += FAMILY_GAP + blockWidth;
    }

    subtreeWidths.set(personId, width);
    return width;
  }

  function place(personId: string, leftX: number, gen: number): void {
    placedPersons.set(personId, { x: leftX, gen });

    let cursor = leftX + PERSON_NODE_WIDTH;

    for (const uid of index.unionsOfPerson.get(personId) ?? []) {
      const info = clusterInfo.get(uid);
      if (!info || info.anchorId !== personId) continue;
      const blockLeft = cursor + FAMILY_GAP;
      cursor = blockLeft + info.blockWidth + FAMILY_GAP;

      // Couple segment sits at the left edge of its block
      const unionNodeX = leftX + PERSON_NODE_WIDTH + COUPLE_GAP;
      placedUnions.set(uid, {
        x: unionNodeX,
        y: bandForGen(gen),
        anchorId: personId,
      });

      if (
        info.spouseId &&
        info.spouseId !== personId &&
        !placedPersons.has(info.spouseId)
      ) {
        place(info.spouseId, unionNodeX + UNION_NODE_WIDTH + COUPLE_GAP, gen);
      }

      // Children centered under the union block
      const childIds = collapsed.has(personId)
        ? []
        : index.childrenOfUnion.get(uid) ?? [];
      const pendingChildren = childIds.filter((c) => !placedPersons.has(c));
      const gapsTotal =
        Math.max(0, pendingChildren.length - 1) * HORIZONTAL_SPACING;
      const childrenSpan =
        pendingChildren.reduce((acc, c) => acc + (subtreeWidths.get(c) ?? PERSON_NODE_WIDTH), 0) +
        gapsTotal;
      let childCursor = blockLeft + (info.blockWidth - childrenSpan) / 2;

      for (const childId of pendingChildren) {
        const w = subtreeWidths.get(childId) ?? PERSON_NODE_WIDTH;
        const childGen = generations.get(childId) ?? gen + 1;
        place(childId, childCursor, childGen);
        childCursor += w + HORIZONTAL_SPACING;
      }
    }
  }

  // Seeds for measurement: focus or root persons, top generations first
  const measureSeeds: string[] = [];
  if (focusPersonId && generations.has(focusPersonId)) {
    measureSeeds.push(focusPersonId);
  } else {
    const ordered = [...generations.entries()].sort((a, b) => a[1] - b[1]);
    for (const [pid] of ordered) {
      const parentUnions = (index.parentUnionsOf.get(pid) ?? []).filter((uid) =>
        index.unionMap.has(uid)
      );
      if (parentUnions.length === 0) measureSeeds.push(pid);
    }
  }

  // Place every connected cluster left to right
  let cursorX = 0;
  for (const seed of measureSeeds) {
    if (placedPersons.has(seed) || visitedPersons.has(seed)) continue;
    const width = measure(seed);
    place(seed, cursorX, generations.get(seed) ?? minGen);
    cursorX += width + CLUSTER_GAP;
  }

  // Any remaining unplaced persons (cycles, odd graphs): extra columns
  for (const pid of generations.keys()) {
    if (placedPersons.has(pid)) continue;
    if (visitedPersons.has(pid)) continue;
    const width = measure(pid);
    place(pid, cursorX, generations.get(pid) ?? minGen);
    cursorX += width + CLUSTER_GAP;
  }
  // Persons visited as spouses but never positioned (edge cases)
  for (const pid of generations.keys()) {
    if (!placedPersons.has(pid)) {
      place(pid, cursorX, generations.get(pid) ?? minGen);
      cursorX += PERSON_NODE_WIDTH + CLUSTER_GAP;
    }
  }

  if (placedPersons.size === 0) return emptyLayout;

  // ---------------------------------------------
  // 4. Build nodes
  // ---------------------------------------------
  const nodes: LayoutNode[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [pid, pos] of placedPersons) {
    const person = index.personMap.get(pid);
    if (!person) continue;
    nodes.push({
      id: `person-${pid}`,
      type: "person",
      personId: pid,
      x: pos.x,
      y: yForGen(pos.gen),
      width: PERSON_NODE_WIDTH,
      height: PERSON_NODE_HEIGHT,
      data: person,
    });
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + PERSON_NODE_WIDTH);
    minY = Math.min(minY, yForGen(pos.gen));
    maxY = Math.max(maxY, yForGen(pos.gen) + PERSON_NODE_HEIGHT);
  }

  for (const [uid, pos] of placedUnions) {
    const union = index.unionMap.get(uid);
    if (!union) continue;
    nodes.push({
      id: `union-${uid}`,
      type: "union",
      unionId: uid,
      x: pos.x,
      y: pos.y,
      width: UNION_NODE_WIDTH,
      height: UNION_NODE_HEIGHT,
      data: union,
    });
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + UNION_NODE_WIDTH);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + UNION_NODE_HEIGHT);
  }

  // ---------------------------------------------
  // 5. Build edges
  // ---------------------------------------------
  const edges: LayoutEdge[] = [];

  for (const [uid, pos] of placedUnions) {
    const union = index.unionMap.get(uid)!;
    const unionNodeId = `union-${uid}`;

    if (placedPersons.has(pos.anchorId)) {
      edges.push({
        from: `person-${pos.anchorId}`,
        to: unionNodeId,
        type: "union_member",
      });
    }

    const spouseId = otherMember(union, pos.anchorId);
    if (spouseId && placedPersons.has(spouseId)) {
      edges.push({
        from: unionNodeId,
        to: `person-${spouseId}`,
        type: "union_member",
      });
    }

    for (const childId of index.childrenOfUnion.get(uid) ?? []) {
      if (placedPersons.has(childId)) {
        edges.push({
          from: unionNodeId,
          to: `person-${childId}`,
          type: "union_child",
        });
      }
    }
  }

  return {
    nodes,
    edges,
    width: maxX - minX,
    height: maxY - minY,
    bounds: { minX, maxX, minY, maxY },
  };
}
