import { createClient } from "@/lib/supabase/client";
import type { Person, Union, UnionWithPersons } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export interface UnionChildRow {
  union_id: string;
  person_id: string;
}

export interface UnionChildWithPerson extends UnionChildRow {
  person: Person | null;
}

export type CreateUnionData = Omit<Union, "id" | "created_at" | "updated_at">;

export type UpdateUnionData = Partial<
  Omit<Union, "id" | "created_at" | "updated_at">
>;

export async function getUnions(
  familyId: string
): Promise<ServiceResult<Union[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("unions")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as Union[], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch unions",
    };
  }
}

export async function getUnion(
  id: string
): Promise<ServiceResult<UnionWithPersons | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("unions")
      .select(
        `
        *,
        person_a:persons!unions_person_a_id_fkey(*),
        person_b:persons!unions_person_b_id_fkey(*)
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as UnionWithPersons, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch union",
    };
  }
}

export async function createUnion(
  data: CreateUnionData
): Promise<ServiceResult<Union | null>> {
  try {
    const supabase = createClient();
    const { data: union, error } = await supabase
      .from("unions")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: union, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create union",
    };
  }
}

export async function updateUnion(
  id: string,
  data: UpdateUnionData
): Promise<ServiceResult<Union | null>> {
  try {
    const supabase = createClient();
    const { data: union, error } = await supabase
      .from("unions")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: union, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update union",
    };
  }
}

export async function deleteUnion(id: string): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error: childrenError } = await supabase
      .from("union_children")
      .delete()
      .eq("union_id", id);

    if (childrenError) {
      return { data: null, error: childrenError.message };
    }

    const { error } = await supabase.from("unions").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete union",
    };
  }
}

export async function getUnionsForPerson(
  personId: string
): Promise<ServiceResult<UnionWithPersons[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("unions")
      .select(
        `
        *,
        person_a:persons!unions_person_a_id_fkey(*),
        person_b:persons!unions_person_b_id_fkey(*)
        `
      )
      .or(`person_a_id.eq.${personId},person_b_id.eq.${personId}`)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as UnionWithPersons[], error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error
          ? err.message
          : "Failed to fetch unions for person",
    };
  }
}

export async function addChildToUnion(
  unionId: string,
  personId: string
): Promise<ServiceResult<UnionChildRow | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("union_children")
      .insert({ union_id: unionId, person_id: personId })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as UnionChildRow, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to add child to union",
    };
  }
}

export async function removeChildFromUnion(
  unionId: string,
  personId: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("union_children")
      .delete()
      .eq("union_id", unionId)
      .eq("person_id", personId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Failed to remove child from union",
    };
  }
}

export async function getUnionChildren(
  unionId: string
): Promise<ServiceResult<UnionChildWithPerson[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("union_children")
      .select("*, person:persons(*)")
      .eq("union_id", unionId)
      .order("person_id", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const rows = (data ?? []) as Array<{
      union_id: string;
      person_id: string;
      person: Person | null;
    }>;

    return { data: rows, error: null };
  } catch (err) {
    return {
      data: [],
      error:
        err instanceof Error ? err.message : "Failed to fetch union children",
    };
  }
}
