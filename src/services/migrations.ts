import { createClient } from "@/lib/supabase/client";
import type { MigrationRecord } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getByPerson(
  personId: string
): Promise<ServiceResult<MigrationRecord[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_migrations")
      .select("*")
      .eq("person_id", personId)
      .order("date_start", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch migrations",
    };
  }
}

export async function getByTree(
  treeId: string
): Promise<ServiceResult<MigrationRecord[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_migrations")
      .select("*, persons!inner(tree_id)")
      .eq("persons.tree_id", treeId)
      .order("date_start", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch migrations",
    };
  }
}

export async function create(
  data: Omit<MigrationRecord, "id" | "created_at">
): Promise<ServiceResult<MigrationRecord | null>> {
  try {
    const supabase = createClient();
    const { data: migration, error } = await supabase
      .from("family_migrations")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: migration, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create migration",
    };
  }
}

export async function update(
  id: string,
  data: Partial<Omit<MigrationRecord, "id" | "created_at">>
): Promise<ServiceResult<MigrationRecord | null>> {
  try {
    const supabase = createClient();
    const { data: migration, error } = await supabase
      .from("family_migrations")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: migration, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update migration",
    };
  }
}

export async function deleteRecord(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("family_migrations").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete migration",
    };
  }
}
