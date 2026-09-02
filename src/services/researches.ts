import { createClient } from "@/lib/supabase/client";
import type { Research } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getResearches(
  familyId: string
): Promise<ServiceResult<Research[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("researches")
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
      error: err instanceof Error ? err.message : "Failed to fetch researches",
    };
  }
}

export async function create(
  data: Omit<Research, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Research | null>> {
  try {
    const supabase = createClient();
    const { data: research, error } = await supabase
      .from("researches")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: research, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create research",
    };
  }
}

export async function update(
  id: string,
  data: Partial<Omit<Research, "id" | "created_at" | "updated_at">>
): Promise<ServiceResult<Research | null>> {
  try {
    const supabase = createClient();
    const { data: research, error } = await supabase
      .from("researches")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: research, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update research",
    };
  }
}

export async function deleteResearch(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("researches").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete research",
    };
  }
}
