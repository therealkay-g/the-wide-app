import { createClient } from "@/lib/supabase/client";
import type { Source } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getSources(
  familyId: string
): Promise<ServiceResult<Source[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch sources",
    };
  }
}

export async function createSource(
  data: Omit<Source, "id" | "created_at">
): Promise<ServiceResult<Source | null>> {
  try {
    const supabase = createClient();
    const { data: source, error } = await supabase
      .from("sources")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: source, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create source",
    };
  }
}

export async function updateSource(
  id: string,
  data: Partial<Omit<Source, "id" | "created_at">>
): Promise<ServiceResult<Source | null>> {
  try {
    const supabase = createClient();
    const { data: source, error } = await supabase
      .from("sources")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: source, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update source",
    };
  }
}

export async function deleteSource(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("sources").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete source",
    };
  }
}
