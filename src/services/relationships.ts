import { createClient } from "@/lib/supabase/client";
import type { Relationship } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getRelationships(
  familyId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch relationships",
    };
  }
}

export async function createRelationship(
  data: Omit<Relationship, "id" | "created_at">
): Promise<ServiceResult<Relationship | null>> {
  try {
    const supabase = createClient();
    const { data: relationship, error } = await supabase
      .from("relationships")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: relationship, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create relationship",
    };
  }
}

export async function deleteRelationship(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("relationships")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete relationship",
    };
  }
}

export async function getParents(
  personId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .eq("related_person_id", personId)
      .in("relationship_type", [
        "BIOLOGICAL_PARENT",
        "ADOPTIVE_PARENT",
        "STEP_PARENT",
      ]);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch parents",
    };
  }
}

export async function getChildren(
  personId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .eq("person_id", personId)
      .in("relationship_type", [
        "BIOLOGICAL_PARENT",
        "ADOPTIVE_PARENT",
        "STEP_PARENT",
      ]);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch children",
    };
  }
}

export async function getSpouses(
  personId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .or(`person_id.eq.${personId},related_person_id.eq.${personId}`)
      .in("relationship_type", ["SPOUSE", "FORMER_SPOUSE"]);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch spouses",
    };
  }
}

export async function getSiblings(
  personId: string
): Promise<ServiceResult<Relationship[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("relationships")
      .select("*")
      .eq("person_id", personId)
      .in("relationship_type", ["SIBLING", "HALF_SIBLING"]);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch siblings",
    };
  }
}
