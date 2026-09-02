import { createClient } from "@/lib/supabase/client";
import type { Person, Relationship, Union } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

interface GetPersonsOptions {
  page?: number;
  pageSize?: number;
  gender?: string;
}

export interface SiblingSummary {
  person: Person;
  sibling_type: "full" | "half";
}

export interface PersonWithRelations extends Person {
  relationships?: Relationship[];
  unions?: Union[];
  parent_unions?: Union[];
  siblings?: SiblingSummary[];
}

interface UnionChildLink {
  union_id: string;
  person_id: string;
}

export async function getPersons(
  treeId: string,
  options: GetPersonsOptions = {}
): Promise<ServiceResult<Person[]>> {
  const { page = 1, pageSize = 50, gender } = options;

  try {
    const supabase = createClient();
    let builder = supabase
      .from("persons")
      .select("*")
      .eq("tree_id", treeId);

    if (gender) {
      builder = builder.eq("gender", gender);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await builder
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(from, to);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch persons",
    };
  }
}

export async function getPerson(
  id: string
): Promise<ServiceResult<PersonWithRelations | null>> {
  try {
    const supabase = createClient();
    const [personRes, relsRes, unionsRes, childLinksRes] = await Promise.all([
      supabase.from("persons").select("*").eq("id", id).single(),
      supabase.from("relationships").select("*").eq("person_id", id),
      supabase
        .from("unions")
        .select("*")
        .or(`person_a_id.eq.${id},person_b_id.eq.${id}`),
      supabase.from("union_children").select("union_id").eq("person_id", id),
    ]);

    if (personRes.error) {
      return { data: null, error: personRes.error.message };
    }

    const parentUnionIds = [
      ...new Set(
        ((childLinksRes.data ?? []) as Array<{ union_id: string }>).map(
          (row) => row.union_id
        )
      ),
    ];

    let parentUnions: Union[] = [];
    let siblingLinks: UnionChildLink[] = [];

    if (parentUnionIds.length > 0) {
      const [parentUnionsRes, siblingLinksRes] = await Promise.all([
        supabase.from("unions").select("*").in("id", parentUnionIds),
        supabase
          .from("union_children")
          .select("union_id, person_id")
          .in("union_id", parentUnionIds)
          .neq("person_id", id),
      ]);

      if (parentUnionsRes.error) {
        return { data: null, error: parentUnionsRes.error.message };
      }

      parentUnions = (parentUnionsRes.data ?? []) as Union[];
      siblingLinks = (siblingLinksRes.data ?? []) as UnionChildLink[];
    }

    const parentsByUnionId = new Map<string, string[]>();
    for (const union of parentUnions) {
      parentsByUnionId.set(
        union.id,
        ([union.person_a_id, union.person_b_id] as Array<string | null>).filter(
          (pid): pid is string => Boolean(pid)
        )
      );
    }

    const sharedParentsBySiblingId = new Map<string, Set<string>>();
    for (const link of siblingLinks) {
      const parents = parentsByUnionId.get(link.union_id);
      if (!parents) continue;
      let shared = sharedParentsBySiblingId.get(link.person_id);
      if (!shared) {
        shared = new Set<string>();
        sharedParentsBySiblingId.set(link.person_id, shared);
      }
      for (const parentId of parents) {
        shared.add(parentId);
      }
    }

    const siblingIds = [...sharedParentsBySiblingId.keys()];
    let siblings: SiblingSummary[] = [];

    if (siblingIds.length > 0) {
      const { data: siblingPersons, error: siblingsError } = await supabase
        .from("persons")
        .select("*")
        .in("id", siblingIds);

      if (siblingsError) {
        return { data: null, error: siblingsError.message };
      }

      siblings = ((siblingPersons ?? []) as Person[]).map((person) => ({
        person,
        sibling_type:
          (sharedParentsBySiblingId.get(person.id)?.size ?? 0) >= 2
            ? ("full" as const)
            : ("half" as const),
      }));
    }

    return {
      data: {
        ...(personRes.data as Person),
        relationships: (relsRes.data ?? []) as Relationship[],
        unions: (unionsRes.data ?? []) as Union[],
        parent_unions: parentUnions,
        siblings,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch person",
    };
  }
}

export async function createPerson(
  data: Omit<Person, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Person | null>> {
  try {
    const supabase = createClient();
    const { data: person, error } = await supabase
      .from("persons")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: person, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create person",
    };
  }
}

export async function updatePerson(
  id: string,
  data: Partial<Omit<Person, "id" | "created_at" | "updated_at">>
): Promise<ServiceResult<Person | null>> {
  try {
    const supabase = createClient();
    const { data: person, error } = await supabase
      .from("persons")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updatePerson DB error:", JSON.stringify(error));
      return { data: null, error: error.message };
    }

    return { data: person, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update person",
    };
  }
}

export async function deletePerson(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("persons").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete person",
    };
  }
}

export async function getPersonRelations(
  personId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .or(`person_id.eq.${personId},related_person_id.eq.${personId}`);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch relations",
    };
  }
}

export async function searchPersons(
  treeId: string,
  query: string
): Promise<ServiceResult<Person[]>> {
  try {
    const supabase = createClient();
    const searchPattern = `%${query}%`;

    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("tree_id", treeId)
      .or(
        `first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},middle_name.ilike.${searchPattern},nickname.ilike.${searchPattern}`
      )
      .order("last_name", { ascending: true })
      .limit(50);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to search persons",
    };
  }
}
