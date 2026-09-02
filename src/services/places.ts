import { createClient } from "@/lib/supabase/client";
import type { Place } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getPlaces(
  familyId: string
): Promise<ServiceResult<Place[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("family_id", familyId)
      .order("name", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch places",
    };
  }
}

export async function createPlace(
  data: Omit<Place, "id" | "created_at">
): Promise<ServiceResult<Place | null>> {
  try {
    const supabase = createClient();
    const { data: place, error } = await supabase
      .from("places")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: place, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create place",
    };
  }
}

export async function updatePlace(
  id: string,
  data: Partial<Omit<Place, "id" | "created_at">>
): Promise<ServiceResult<Place | null>> {
  try {
    const supabase = createClient();
    const { data: place, error } = await supabase
      .from("places")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: place, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update place",
    };
  }
}

export async function deletePlace(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("places").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete place",
    };
  }
}
