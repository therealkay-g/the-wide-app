import type { Person, Relationship, Union } from "@/types";

export interface UnionChildLink {
  union_id: string;
  person_id: string;
}

export interface CalculatedRelationship {
  personId: string;
  relatedPersonId: string;
  relationship: string;
  distance: number;
  path: string[];
}

export interface RelationshipPath {
  from: string;
  to: string;
  path: string[];
  relationships: string[];
  description: string;
}

export type ParentKind = "biological" | "adoptive" | "step";

interface ParentLink {
  parentId: string;
  kind: ParentKind;
}

interface ChildLink {
  childId: string;
  kind: ParentKind;
}

interface SpouseLink {
  spouseId: string;
  ended: boolean;
}

interface KinshipGraph {
  persons: Map<string, Person>;
  parentsOf: Map<string, ParentLink[]>;
  childrenOf: Map<string, ChildLink[]>;
  spousesOf: Map<string, SpouseLink[]>;
  fullSiblingsOf: Map<string, Set<string>>;
  halfSiblingsOf: Map<string, Set<string>>;
  stepParentsOf: Map<string, string[]>;
  stepChildrenOf: Map<string, string[]>;
}

type KinshipMove = "up" | "down" | "side";

type StepKind = ParentKind | "spouse" | "former_spouse";

interface BfsStep {
  move: KinshipMove;
  kind: StepKind;
}

interface BfsNode {
  id: string;
  path: string[];
  steps: BfsStep[];
  expandable: boolean;
}

const MAX_DEPTH = 32;

const GENDERED_TERMS = {
  parent: { male: "father", female: "mother", neutral: "parent" },
  grandparent: {
    male: "grandfather",
    female: "grandmother",
    neutral: "grandparent",
  },
  child: { male: "son", female: "daughter", neutral: "child" },
  grandchild: {
    male: "grandson",
    female: "granddaughter",
    neutral: "grandchild",
  },
  sibling: { male: "brother", female: "sister", neutral: "sibling" },
  halfSibling: {
    male: "half-brother",
    female: "half-sister",
    neutral: "half-sibling",
  },
  auntUncle: { male: "uncle", female: "aunt", neutral: "uncle/aunt" },
  nephewNiece: { male: "nephew", female: "niece", neutral: "nephew/niece" },
  spouse: { male: "husband", female: "wife", neutral: "spouse" },
  formerSpouse: {
    male: "former husband",
    female: "former wife",
    neutral: "former spouse",
  },
  coSpouse: { male: "co-husband", female: "co-wife", neutral: "co-spouse" },
  parentInLaw: {
    male: "father-in-law",
    female: "mother-in-law",
    neutral: "parent-in-law",
  },
  grandparentInLaw: {
    male: "grandfather-in-law",
    female: "grandmother-in-law",
    neutral: "grandparent-in-law",
  },
  childInLaw: {
    male: "son-in-law",
    female: "daughter-in-law",
    neutral: "child-in-law",
  },
  grandchildInLaw: {
    male: "grandson-in-law",
    female: "granddaughter-in-law",
    neutral: "grandchild-in-law",
  },
  siblingInLaw: {
    male: "brother-in-law",
    female: "sister-in-law",
    neutral: "sibling-in-law",
  },
  stepParent: {
    male: "stepfather",
    female: "stepmother",
    neutral: "stepparent",
  },
  stepChild: {
    male: "stepson",
    female: "stepdaughter",
    neutral: "stepchild",
  },
} as const;

type GenderedTermKey = keyof typeof GENDERED_TERMS;

function pickTerm(key: GenderedTermKey, person?: Person): string {
  const term = GENDERED_TERMS[key];
  if (person?.gender === "female") return term.female;
  if (person?.gender === "male") return term.male;
  return term.neutral;
}

function getAdoptionType(person: Person | undefined): string | null {
  const value = (person as unknown as Record<string, unknown>)?.adoption_type;
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isAdoptiveChild(person: Person | undefined): boolean {
  const type = getAdoptionType(person);
  return type !== null && /adopt/i.test(type);
}

function isEndedUnion(union: Union): boolean {
  return typeof union.status === "string"
    ? /divorc|ended|separat|annul|widow/i.test(union.status)
    : false;
}

function displayName(person: Person | undefined): string {
  if (!person) return "Inconnu";
  const name = [person.first_name, person.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();
  if (name) return name;
  return (
    person.nickname ||
    person.traditional_name ||
    [person.post_name, person.middle_name].filter(Boolean).join(" ") ||
    "Inconnu"
  );
}

function addUnique(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (!list) {
    map.set(key, [value]);
    return;
  }
  if (!list.includes(value)) list.push(value);
}

function addParentLink(graph: KinshipGraph, link: ParentLink, childId: string) {
  if (childId === link.parentId) return;
  if (!graph.persons.has(childId) || !graph.persons.has(link.parentId)) return;

  const parents = graph.parentsOf.get(childId);
  if (parents) {
    if (
      !parents.some(
        (existing) =>
          existing.parentId === link.parentId &&
          existing.kind === link.kind
      )
    ) {
      parents.push(link);
    }
  } else {
    graph.parentsOf.set(childId, [link]);
  }

  const children = graph.childrenOf.get(link.parentId);
  if (children) {
    if (
      !children.some(
        (existing) => existing.childId === childId && existing.kind === link.kind
      )
    ) {
      children.push({ childId, kind: link.kind });
    }
  } else {
    graph.childrenOf.set(link.parentId, [{ childId, kind: link.kind }]);
  }
}

function addSpouseLink(
  graph: KinshipGraph,
  personA: string,
  personB: string,
  ended: boolean
) {
  if (personA === personB) return;
  if (!graph.persons.has(personA) || !graph.persons.has(personB)) return;

  for (const [from, to] of [
    [personA, personB],
    [personB, personA],
  ]) {
    const spouses = graph.spousesOf.get(from);
    const link: SpouseLink = { spouseId: to, ended };
    if (spouses) {
      if (!spouses.some((existing) => existing.spouseId === to)) {
        spouses.push(link);
      }
    } else {
      graph.spousesOf.set(from, [link]);
    }
  }
}

function addSiblingHint(
  graph: KinshipGraph,
  personA: string,
  personB: string,
  kind: "full" | "half"
) {
  if (personA === personB) return;
  const targetMap = kind === "full" ? graph.fullSiblingsOf : graph.halfSiblingsOf;
  if (!targetMap.has(personA)) targetMap.set(personA, new Set());
  if (!targetMap.has(personB)) targetMap.set(personB, new Set());
  targetMap.get(personA)!.add(personB);
  targetMap.get(personB)!.add(personA);
}

export function buildKinshipGraph(
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[],
  relationships: Relationship[] = []
): KinshipGraph {
  const graph: KinshipGraph = {
    persons: new Map(persons.map((person) => [person.id, person])),
    parentsOf: new Map(),
    childrenOf: new Map(),
    spousesOf: new Map(),
    fullSiblingsOf: new Map(),
    halfSiblingsOf: new Map(),
    stepParentsOf: new Map(),
    stepChildrenOf: new Map(),
  };

  const childrenByUnion = new Map<string, string[]>();
  for (const link of unionChildren) {
    const list = childrenByUnion.get(link.union_id);
    if (list) {
      if (!list.includes(link.person_id)) list.push(link.person_id);
    } else {
      childrenByUnion.set(link.union_id, [link.person_id]);
    }
  }

  for (const union of unions) {
    const parentIds = [union.person_a_id, union.person_b_id].filter(
      (pid): pid is string => Boolean(pid) && graph.persons.has(pid as string)
    );
    const childIds = (childrenByUnion.get(union.id) ?? []).filter((cid) =>
      graph.persons.has(cid)
    );

    for (const parentId of parentIds) {
      for (const childId of childIds) {
        addParentLink(graph, { parentId, kind: "biological" }, childId);
      }
    }

    if (parentIds.length === 2) {
      addSpouseLink(graph, parentIds[0], parentIds[1], isEndedUnion(union));
    }
  }

  for (const rel of relationships) {
    switch (rel.relationship_type) {
      case "BIOLOGICAL_PARENT":
        addParentLink(
          graph,
          { parentId: rel.person_id, kind: "biological" },
          rel.related_person_id
        );
        break;
      case "ADOPTIVE_PARENT":
        addParentLink(
          graph,
          { parentId: rel.person_id, kind: "adoptive" },
          rel.related_person_id
        );
        break;
      case "SPOUSE":
        addSpouseLink(graph, rel.person_id, rel.related_person_id, false);
        break;
      case "FORMER_SPOUSE":
        addSpouseLink(graph, rel.person_id, rel.related_person_id, true);
        break;
      case "SIBLING":
        addSiblingHint(graph, rel.person_id, rel.related_person_id, "full");
        break;
      case "HALF_SIBLING":
        addSiblingHint(graph, rel.person_id, rel.related_person_id, "half");
        break;
      default:
        break;
    }
  }

  for (const [childId, parentLinks] of graph.parentsOf) {
    for (const parentLink of parentLinks) {
      if (parentLink.kind === "step") continue;
      for (const spouseLink of graph.spousesOf.get(parentLink.parentId) ?? []) {
        const stepId = spouseLink.spouseId;
        if (stepId === childId) continue;
        if (parentLinks.some((existing) => existing.parentId === stepId)) {
          continue;
        }
        addUnique(graph.stepParentsOf, childId, stepId);
        addUnique(graph.stepChildrenOf, stepId, childId);
      }
    }
  }

  return graph;
}

function neighborsOf(
  graph: KinshipGraph,
  nodeId: string,
  depth: number
): Array<{ id: string; step: BfsStep; expandable: boolean }> {
  const node = graph.persons.get(nodeId);
  const result: Array<{ id: string; step: BfsStep; expandable: boolean }> = [];

  for (const link of graph.parentsOf.get(nodeId) ?? []) {
    if (link.kind !== "step") {
      result.push({
        id: link.parentId,
        step: { move: "up", kind: link.kind },
        expandable: true,
      });
    }
  }

  for (const link of graph.childrenOf.get(nodeId) ?? []) {
    if (link.kind !== "step") {
      result.push({
        id: link.childId,
        step: { move: "down", kind: link.kind },
        expandable: true,
      });
    }
  }

  for (const link of graph.spousesOf.get(nodeId) ?? []) {
    result.push({
      id: link.spouseId,
      step: {
        move: "side",
        kind: link.ended ? "former_spouse" : "spouse",
      },
      expandable: true,
    });
  }

  if (depth === 0) {
    for (const stepId of graph.stepParentsOf.get(nodeId) ?? []) {
      result.push({
        id: stepId,
        step: { move: "up", kind: "step" },
        expandable: false,
      });
    }
    for (const stepChildId of graph.stepChildrenOf.get(nodeId) ?? []) {
      result.push({
        id: stepChildId,
        step: { move: "down", kind: "step" },
        expandable: false,
      });
    }
  } else if (node) {
    const adoptionApplies =
      [...(graph.parentsOf.get(nodeId) ?? [])].some(
        (link) => link.kind === "adoptive"
      ) || isAdoptiveChild(node);
    void adoptionApplies;
  }

  return result;
}

function bfsFrom(graph: KinshipGraph, sourceId: string): Map<string, BfsNode> {
  const source = graph.persons.get(sourceId);
  if (!source) return new Map();

  const reached = new Map<string, BfsNode>();
  const queue: BfsNode[] = [
    { id: sourceId, path: [sourceId], steps: [], expandable: true },
  ];
  reached.set(sourceId, queue[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (!current.expandable) continue;
    if (current.path.length - 1 >= MAX_DEPTH) continue;

    for (const neighbor of neighborsOf(graph, current.id, current.path.length - 1)) {
      if (reached.has(neighbor.id)) continue;
      const next: BfsNode = {
        id: neighbor.id,
        path: [...current.path, neighbor.id],
        steps: [...current.steps, neighbor.step],
        expandable: neighbor.expandable,
      };
      reached.set(neighbor.id, next);
      queue.push(next);
    }
  }

  return reached;
}

function sharedParentCount(
  graph: KinshipGraph,
  personA: string,
  personB: string
): number {
  const aParents = new Set(
    (graph.parentsOf.get(personA) ?? [])
      .filter((link) => link.kind !== "step")
      .map((link) => link.parentId)
  );
  let count = 0;
  for (const link of graph.parentsOf.get(personB) ?? []) {
    if (link.kind !== "step" && aParents.has(link.parentId)) count += 1;
  }
  return Math.min(count, 2);
}

function siblingLabelFor(
  graph: KinshipGraph,
  sourceId: string,
  target: Person
): string {
  const explicitHalf = graph.halfSiblingsOf.get(sourceId)?.has(target.id);
  const explicitFull = graph.fullSiblingsOf.get(sourceId)?.has(target.id);
  if (explicitFull && !explicitHalf) {
    return pickTerm("sibling", target);
  }
  if (explicitHalf && !explicitFull) {
    return pickTerm("halfSibling", target);
  }
  const shared = sharedParentCount(graph, sourceId, target.id);
  if (shared >= 2 || (explicitFull && shared >= 1)) {
    return pickTerm("sibling", target);
  }
  return pickTerm("halfSibling", target);
}

type OrdinalWord = "first" | "second" | "third" | "fourth" | "fifth";

const ORDINALS: OrdinalWord[] = ["first", "second", "third", "fourth", "fifth"];

function greatPrefix(count: number): string {
  return "great-".repeat(Math.max(count, 0));
}

function bloodTermFor(
  ups: number,
  downs: number,
  target: Person
):
  | { key: GenderedTermKey; greats?: number; cousinDegree?: number }
  | { custom: string }
  | null {
  if (ups === 0 && downs === 0) return null;
  if (downs === 0) {
    if (ups === 1) return { key: "parent" };
    return { key: "grandparent", greats: ups - 2 };
  }
  if (ups === 0) {
    if (downs === 1) return { key: "child" };
    return { key: "grandchild", greats: downs - 2 };
  }
  if (ups === 1 && downs === 1) return { key: "sibling" };
  if (ups === 2 && downs === 1) return { key: "auntUncle" };
  if (ups === 1 && downs === 2) return { key: "nephewNiece" };
  if (ups >= 2 && downs === ups) {
    return { key: "auntUncle", cousinDegree: ups - 2 };
  }
  if (ups >= 3 && downs === 1) {
    return { key: "auntUncle", greats: ups - 3 };
  }
  if (ups === 1 && downs >= 3) {
    return { key: "nephewNiece", greats: downs - 3 };
  }
  if (ups > 2 && downs === 2) {
    return { key: "nephewNiece", greats: ups - 3 + 1 };
  }
  if (downs > 2 && ups === 2) {
    return { key: "auntUncle", greats: downs - 3 + 1 };
  }
  return { custom: "distant relative" };
}

function formatBloodLabel(
  term: NonNullable<ReturnType<typeof bloodTermFor>>,
  target: Person,
  options: { adoptive?: boolean; half?: boolean } = {}
): string {
  if ("custom" in term) return term.custom;

  if (term.cousinDegree !== undefined) {
    if (term.cousinDegree === 0) {
      return genderAwareCousin(target);
    }
    const ordinal = ORDINALS[term.cousinDegree - 1] ?? `degree ${term.cousinDegree}`;
    return `${ordinal} ${genderAwareCousin(target)}`;
  }

  const base = pickTerm(term.key, target);
  const greats = term.greats !== undefined && term.greats > 0 ? greatPrefix(term.greats) : "";
  const greatLabel = greats
    ? applyGreatToLabel(base, greats)
    : base;

  let label = greatLabel;
  if (options.adoptive) {
    label = `adoptive ${lowerFirst(label)}`;
  } else if (options.half) {
    label = `half-${lowerFirst(label)}`;
  }
  return label;
}

function genderAwareCousin(target: Person): string {
  return target.gender === "female" ? "cousin" : "cousin";
}

function applyGreatToLabel(label: string, greats: string): string {
  if (label.startsWith("grand")) {
    return `${greats}${label}`;
  }
  return `${greats}${lowerFirst(label)}`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function classifyRelation(
  graph: KinshipGraph,
  sourceId: string,
  target: Person,
  node: BfsNode
): string {
  const steps = node.steps;
  let lead = 0;
  while (lead < steps.length && steps[lead].move === "side") lead += 1;
  let tail = 0;
  while (
    tail < steps.length - lead &&
    steps[steps.length - 1 - tail].move === "side"
  ) {
    tail += 1;
  }

  const middle = steps.slice(lead, steps.length - tail);
  const midHasSide = middle.some((step) => step.move === "side");
  const ups = middle.filter((step) => step.move === "up").length;
  const downs = middle.filter((step) => step.move === "down").length;
  const midKinds = middle.map((step) => step.kind);

  const lastLeadKind = lead > 0 ? steps[lead - 1].kind : undefined;
  const firstTailKind =
    tail > 0 ? steps[steps.length - tail]!.kind : undefined;

  if (middle.length === 0) {
    if (lead === 1) {
      return lastLeadKind === "former_spouse"
        ? pickTerm("formerSpouse", target)
        : pickTerm("spouse", target);
    }
    if (lead === 2 && tail === 0) {
      return pickTerm("coSpouse", target);
    }
    return "relative by marriage";
  }

  if (midHasSide || ups + downs !== middle.length) {
    return "relative";
  }

  const anyAdoptiveUp = midKinds.includes("adoptive");
  const stepEdge = midKinds.includes("step");

  if (tail === 0 && lead >= 1) {
    const inLaw = inLawTransform(ups, downs, target);
    if (inLaw) return inLaw;
  }

  if (lead === 0 && tail === 1) {
    const transformed = marriageTransform(ups, downs, target, stepEdge);
    if (transformed) return transformed;
  }

  if (lead === 0 && tail === 0) {
    if (ups === 1 && downs === 0) {
      if (stepEdge || midKinds[0] === "step") {
        return pickTerm("stepParent", target);
      }
      if (anyAdoptiveUp || isAdoptiveChild(target)) {
        return `adoptive ${lowerFirst(pickTerm("parent", target))}`;
      }
      return pickTerm("parent", target);
    }
    if (ups === 0 && downs === 1) {
      if (stepEdge || midKinds[0] === "step") {
        return pickTerm("stepChild", target);
      }
      if (midKinds[0] === "adoptive" || isAdoptiveChild(target)) {
        return `adoptive ${lowerFirst(pickTerm("child", target))}`;
      }
      return pickTerm("child", target);
    }
    if (ups === 1 && downs === 1) {
      return siblingLabelFor(graph, sourceId, target);
    }
    const term = bloodTermFor(ups, downs, target);
    if (term) {
      return formatBloodLabel(term, target, {
        adoptive: anyAdoptiveUp && ups > 0,
      });
    }
  }

  return "relative";
}

function inLawTransform(
  ups: number,
  downs: number,
  target: Person
): string | null {
  if (ups > 0 && downs === 0) {
    if (ups === 1) return pickTerm("parentInLaw", target);
    return formatBloodLabel({ key: "grandparent", greats: ups - 2 }, target).replace(
      /^(great-)*grand/,
      (match) => match
    ).concat("")
      ? `${greatPrefix(ups - 2)}${pickTerm("grandparentInLaw", target)}`
      : pickTerm("grandparentInLaw", target);
  }
  if (downs > 0 && ups === 0) {
    if (downs === 1) return pickTerm("stepChild", target);
    if (downs === 2) {
      return `${pickTerm("stepChild", target)}`.replace(/step/, "step-great-grand")
        .includes("step-great-grand")
        ? pickTerm("stepChild", target).replace(/^step/, "step-great-grand")
        : pickTerm("stepChild", target);
    }
    return `${greatPrefix(downs - 2)}${pickTerm("stepChild", target)}`.replace(
      /^great-+step/,
      "step-great-".repeat(1) + ""
    ).startsWith("step")
      ? `${"step-great-".repeat(downs - 2)}${lowerFirst(pickTerm("stepChild", target)).replace("step", "")}`
      : `${greatPrefix(downs - 2)}${pickTerm("stepChild", target)}`;
  }
  if (ups >= 1 && downs >= 1) {
    if (ups === 1 && downs === 1) return pickTerm("siblingInLaw", target);
    const term = bloodTermFor(ups, downs, target);
    if (term && !("custom" in term)) {
      return formatBloodLabel(term, target);
    }
    return "relative by marriage";
  }
  return null;
}

function marriageTransform(
  ups: number,
  downs: number,
  target: Person,
  stepEdge: boolean
): string | null {
  if (stepEdge && ((ups === 1 && downs === 0) || (ups === 0 && downs === 1))) {
    return ups === 1
      ? pickTerm("stepParent", target)
      : pickTerm("stepChild", target);
  }
  if (ups > 0 && downs === 0) {
    if (ups === 1) return pickTerm("stepParent", target);
    return `${greatPrefix(ups - 2)}${pickTerm("stepParent", target)}`
      .replace(/^great-step/, "step-great-");
  }
  if (downs > 0 && ups === 0) {
    if (downs === 1) return pickTerm("childInLaw", target);
    if (downs === 2) return pickTerm("grandchildInLaw", target);
    return `${greatPrefix(downs - 2)}${lowerFirst(pickTerm("grandchildInLaw", target))}`;
  }
  if (ups >= 1 && downs >= 1) {
    if (ups === 1 && downs === 1) return pickTerm("siblingInLaw", target);
    const term = bloodTermFor(ups, downs, target);
    if (term && !("custom" in term)) {
      return formatBloodLabel(term, target);
    }
    return "relative by marriage";
  }
  return null;
}

function hopLabel(
  graph: KinshipGraph,
  fromId: string,
  toId: string,
  step: BfsStep
): string {
  const target = graph.persons.get(toId);
  switch (step.move) {
    case "up":
      if (step.kind === "step") return pickTerm("stepParent", target);
      if (step.kind === "adoptive") {
        return `adoptive ${lowerFirst(pickTerm("parent", target))}`;
      }
      return pickTerm("parent", target);
    case "down":
      if (step.kind === "step") return pickTerm("stepChild", target);
      if (step.kind === "adoptive" || isAdoptiveChild(target)) {
        return `adoptive ${lowerFirst(pickTerm("child", target))}`;
      }
      return pickTerm("child", target);
    case "side":
      return step.kind === "former_spouse"
        ? pickTerm("formerSpouse", target)
        : pickTerm("spouse", target);
    default:
      return "relative";
  }
}

export function calculateRelationships(
  personId: string,
  persons: Person[],
  unions: Union[],
  relationships: Relationship[],
  unionChildren: UnionChildLink[]
): CalculatedRelationship[] {
  const graph = buildKinshipGraph(persons, unions, unionChildren, relationships);
  if (!graph.persons.has(personId)) return [];

  const reached = bfsFrom(graph, personId);
  const results: CalculatedRelationship[] = [];
  const covered = new Set<string>();

  for (const [otherId, node] of reached) {
    if (otherId === personId) continue;
    const target = graph.persons.get(otherId);
    if (!target) continue;
    covered.add(otherId);
    results.push({
      personId,
      relatedPersonId: otherId,
      relationship: classifyRelation(graph, personId, target, node),
      distance: node.path.length - 1,
      path: node.path,
    });
  }

  const hintSources: Array<["full" | "half", Map<string, Set<string>>]> = [
    ["full", graph.fullSiblingsOf],
    ["half", graph.halfSiblingsOf],
  ];
  for (const [kind, hintMap] of hintSources) {
    for (const otherId of hintMap.get(personId) ?? []) {
      if (covered.has(otherId)) continue;
      const target = graph.persons.get(otherId);
      if (!target) continue;
      covered.add(otherId);
      results.push({
        personId,
        relatedPersonId: otherId,
        relationship:
          kind === "full"
            ? pickTerm("sibling", target)
            : pickTerm("halfSibling", target),
        distance: 1,
        path: [personId, otherId],
      });
    }
  }

  return results;
}

export function findRelationshipPath(
  personAId: string,
  personBId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): RelationshipPath | null {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  const personA = graph.persons.get(personAId);
  const personB = graph.persons.get(personBId);
  if (!personA || !personB) return null;

  if (personAId === personBId) {
    return {
      from: personAId,
      to: personBId,
      path: [personAId],
      relationships: [],
      description: `${displayName(personA)} et ${displayName(personB)} sont la même personne`,
    };
  }

  const reached = bfsFrom(graph, personAId);
  const node = reached.get(personBId);
  if (!node) return null;

  const relationship = classifyRelation(graph, personAId, personB, node);
  const hopLabels = node.steps.map((step, index) =>
    hopLabel(graph, node.path[index], node.path[index + 1], step)
  );

  return {
    from: personAId,
    to: personBId,
    path: node.path,
    relationships: hopLabels,
    description: buildDescription(graph, personA, personB, relationship),
  };
}

function buildDescription(
  graph: KinshipGraph,
  personA: Person,
  personB: Person,
  relationship: string
): string {
  const phrase = toFrenchPhrase(relationship, personB.gender === "female");
  if (!phrase) {
    const adjective = personA.gender === "female" ? "apparentée" : "apparenté";
    return `${displayName(personA)} est ${adjective} à ${displayName(personB)}`;
  }
  return `${displayName(personA)} est ${phrase} de ${displayName(personB)}`;
}

const FRENCH_CORE: Record<string, { word: string; feminine: boolean }> = {
  father: { word: "père", feminine: false },
  mother: { word: "mère", feminine: true },
  parent: { word: "parent", feminine: false },
  grandfather: { word: "grand-père", feminine: false },
  grandmother: { word: "grand-mère", feminine: true },
  grandparent: { word: "grand-parent", feminine: false },
  son: { word: "fils", feminine: false },
  daughter: { word: "fille", feminine: true },
  child: { word: "enfant", feminine: false },
  grandson: { word: "petit-fils", feminine: false },
  granddaughter: { word: "petite-fille", feminine: true },
  grandchild: { word: "petit-enfant", feminine: false },
  brother: { word: "frère", feminine: false },
  sister: { word: "sœur", feminine: true },
  sibling: { word: "frère", feminine: false },
  "half-brother": { word: "demi-frère", feminine: false },
  "half-sister": { word: "demi-sœur", feminine: true },
  uncle: { word: "oncle", feminine: false },
  aunt: { word: "tante", feminine: true },
  nephew: { word: "neveu", feminine: false },
  niece: { word: "nièce", feminine: true },
  cousin: { word: "cousin", feminine: false },
  husband: { word: "mari", feminine: false },
  wife: { word: "épouse", feminine: true },
  spouse: { word: "conjoint", feminine: false },
  "former husband": { word: "ancien mari", feminine: false },
  "former wife": { word: "ancienne épouse", feminine: true },
  "former spouse": { word: "ancien conjoint", feminine: false },
  "co-wife": { word: "co-épouse", feminine: true },
  "co-husband": { word: "co-époux", feminine: false },
  "co-spouse": { word: "co-époux", feminine: false },
  stepfather: { word: "beau-père", feminine: false },
  stepmother: { word: "belle-mère", feminine: true },
  stepparent: { word: "beau-parent", feminine: false },
  stepson: { word: "beau-fils", feminine: false },
  stepdaughter: { word: "belle-fille", feminine: true },
  stepchild: { word: "beau-fils", feminine: false },
  "father-in-law": { word: "beau-père", feminine: false },
  "mother-in-law": { word: "belle-mère", feminine: true },
  "parent-in-law": { word: "beau-parent", feminine: false },
  "son-in-law": { word: "gendre", feminine: false },
  "daughter-in-law": { word: "bru", feminine: true },
  "child-in-law": { word: "gendre", feminine: false },
  "brother-in-law": { word: "beau-frère", feminine: false },
  "sister-in-law": { word: "belle-sœur", feminine: true },
  "sibling-in-law": { word: "beau-frère", feminine: false },
  "uncle/aunt": { word: "oncle ou tante", feminine: false },
  "nephew/niece": { word: "neveu ou nièce", feminine: false },
};

function withArticle(word: string, feminine: boolean): string {
  const first = word.charAt(0).toLowerCase();
  if (["a", "e", "i", "o", "u", "é", "è", "ê", "h"].includes(first)) {
    return `l'${word}`;
  }
  return `${feminine ? "la" : "le"} ${word}`;
}

function toFrenchPhrase(label: string, femaleTarget: boolean): string | null {
  const direct = FRENCH_CORE[label];
  if (direct) {
    return withArticle(direct.word, direct.feminine);
  }

  if (label.startsWith("adoptive ")) {
    const coreWord = toFrenchCoreWord(label.slice("adoptive ".length), femaleTarget);
    if (!coreWord) return null;
    return withArticle(`${coreWord} ${femaleTarget ? "adoptive" : "adoptif"}`, femaleTarget);
  }

  if (/^(second|third|fourth|fifth) cousin$/.test(label)) {
    return withArticle(femaleTarget ? "cousine éloignée" : "cousin éloigné", femaleTarget);
  }

  const greatGrandMatch = label.match(/^((?:great-)*)(grandfather|grandmother|grandson|granddaughter)$/);
  if (greatGrandMatch) {
    const greats = greatGrandMatch[1].length / "great-".length;
    const core = FRENCH_CORE[greatGrandMatch[2]];
    if (core) {
      const prefix = "arrière-".repeat(greats);
      return withArticle(`${prefix}${core.word}`, core.feminine);
    }
  }

  if (/^relative/.test(label) || label === "distant relative") {
    return null;
  }

  const inLawMatch = label.match(/^(.+)-in-law$/);
  if (inLawMatch) {
    const coreWord = toFrenchCoreWord(inLawMatch[1], femaleTarget);
    if (coreWord) {
      return withArticle(`${coreWord} par alliance`, femaleTarget);
    }
  }

  const stepGreatMatch = label.match(/^((?:step-)?(?:great-)*)step-(.+)$/);
  if (stepGreatMatch) {
    const coreWord = toFrenchCoreWord(stepGreatMatch[2], femaleTarget);
    if (coreWord) {
      return withArticle(`${coreWord} par alliance`, femaleTarget);
    }
  }

  const stepMatch = label.match(/^step(.+)$/);
  if (stepMatch) {
    const coreWord = toFrenchCoreWord(stepMatch[1], femaleTarget);
    if (coreWord) {
      return withArticle(`${coreWord} par alliance`, femaleTarget);
    }
  }

  return null;
}

function toFrenchCoreWord(word: string, femaleTarget: boolean): string | null {
  const entry = FRENCH_CORE[word];
  if (entry) return entry.word;
  if (word === "cousin") return femaleTarget ? "cousine" : "cousin";
  if (word === "sibling") return femaleTarget ? "sœur" : "frère";
  if (word === "child") return "enfant";
  if (word === "parent") return "parent";
  if (word === "grandchild") return femaleTarget ? "petite-fille" : "petit-fils";
  if (word === "grandparent") return femaleTarget ? "grand-mère" : "grand-père";
  return null;
}

function traverseGenerations(
  graph: KinshipGraph,
  startId: string,
  direction: "up" | "down",
  maxGenerations: number
): Person[] {
  const results: Person[] = [];
  const visited = new Set<string>([startId]);

  let frontier = [startId];
  for (let generation = 1; generation <= maxGenerations; generation += 1) {
    const nextFrontier: string[] = [];
    for (const currentId of frontier) {
      const links =
        direction === "up"
          ? graph.parentsOf.get(currentId) ?? []
          : graph.childrenOf.get(currentId) ?? [];
      for (const link of links) {
        if (link.kind === "step") continue;
        const nextId = direction === "up" ? (link as ParentLink).parentId : (link as ChildLink).childId;
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        const person = graph.persons.get(nextId);
        if (person) results.push(person);
        nextFrontier.push(nextId);
      }
    }
    if (nextFrontier.length === 0) break;
    frontier = nextFrontier;
  }

  return results;
}

export function getAncestors(
  personId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[],
  maxGenerations = 15
): Person[] {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  if (!graph.persons.has(personId)) return [];
  return traverseGenerations(graph, personId, "up", maxGenerations);
}

export function getDescendants(
  personId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[],
  maxGenerations = 15
): Person[] {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  if (!graph.persons.has(personId)) return [];
  return traverseGenerations(graph, personId, "down", maxGenerations);
}

function collectSiblingsBySharedParents(
  graph: KinshipGraph,
  personId: string
): { fullIds: Set<string>; halfIds: Set<string> } {
  const parentIds = new Set(
    (graph.parentsOf.get(personId) ?? [])
      .filter((link) => link.kind !== "step")
      .map((link) => link.parentId)
  );

  const candidates = new Set<string>();
  for (const parentId of parentIds) {
    for (const link of graph.childrenOf.get(parentId) ?? []) {
      if (link.kind === "step") continue;
      if (link.childId !== personId) candidates.add(link.childId);
    }
  }

  const fullIds = new Set<string>();
  const halfIds = new Set<string>();
  for (const candidateId of candidates) {
    const shared = sharedParentCount(graph, personId, candidateId);
    if (shared >= 2) fullIds.add(candidateId);
    else halfIds.add(candidateId);
  }

  for (const siblingId of graph.fullSiblingsOf.get(personId) ?? []) {
    if (siblingId !== personId) fullIds.add(siblingId);
  }
  for (const siblingId of graph.halfSiblingsOf.get(personId) ?? []) {
    if (siblingId !== personId && !fullIds.has(siblingId)) {
      halfIds.add(siblingId);
    }
  }

  return { fullIds, halfIds };
}

export function getSiblings(
  personId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): { full: Person[]; half: Person[] } {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  if (!graph.persons.has(personId)) return { full: [], half: [] };

  const { fullIds, halfIds } = collectSiblingsBySharedParents(graph, personId);
  const toPersons = (ids: Set<string>) =>
    [...ids]
      .map((id) => graph.persons.get(id))
      .filter((person): person is Person => Boolean(person));

  return { full: toPersons(fullIds), half: toPersons(halfIds) };
}

function lineageFollowingGender(
  graph: KinshipGraph,
  startId: string,
  gender: "male" | "female"
): Person[] {
  const lineage: Person[] = [];
  const visited = new Set<string>([startId]);
  let currentId = startId;

  while (lineage.length < MAX_DEPTH) {
    const parentLinks = (graph.parentsOf.get(currentId) ?? []).filter(
      (link) => link.kind !== "step"
    );
    const biological = parentLinks.filter((link) => link.kind === "biological");
    const pool = biological.length > 0 ? biological : parentLinks;
    const match = pool.find((link) => {
      const parent = graph.persons.get(link.parentId);
      return parent?.gender === gender;
    });
    if (!match) break;
    if (visited.has(match.parentId)) break;
    visited.add(match.parentId);

    const parent = graph.persons.get(match.parentId);
    if (!parent) break;
    lineage.push(parent);
    currentId = match.parentId;
  }

  return lineage;
}

export function getPaternalLineage(
  personId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): Person[] {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  if (!graph.persons.has(personId)) return [];
  return lineageFollowingGender(graph, personId, "male");
}

export function getMaternalLineage(
  personId: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
): Person[] {
  const graph = buildKinshipGraph(persons, unions, unionChildren);
  if (!graph.persons.has(personId)) return [];
  return lineageFollowingGender(graph, personId, "female");
}
