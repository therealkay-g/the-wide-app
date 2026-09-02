import { createClient } from "@/lib/supabase/client";
import type { Tree } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getTrees(
  familyId: string
): Promise<ServiceResult<Tree[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trees")
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
      error: err instanceof Error ? err.message : "Failed to fetch trees",
    };
  }
}

export async function getTree(
  id: string
): Promise<ServiceResult<Tree | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch tree",
    };
  }
}

export async function createTree(
  data: Pick<Tree, "family_id" | "name" | "description" | "visibility" | "created_by">
): Promise<ServiceResult<Tree | null>> {
  try {
    const supabase = createClient();
    const { data: tree, error } = await supabase
      .from("trees")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: tree, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create tree",
    };
  }
}

export async function updateTree(
  id: string,
  data: Partial<Pick<Tree, "name" | "description" | "visibility">>
): Promise<ServiceResult<Tree | null>> {
  try {
    const supabase = createClient();
    const { data: tree, error } = await supabase
      .from("trees")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: tree, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update tree",
    };
  }
}

export async function deleteTree(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("trees").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete tree",
    };
  }
}
