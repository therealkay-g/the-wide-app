import { createClient } from "@/lib/supabase/client";
import type { Activity } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getActivities(
  familyId: string
): Promise<ServiceResult<Activity[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch activities",
    };
  }
}

export async function logActivity(
  data: Omit<Activity, "id" | "created_at">
): Promise<ServiceResult<Activity | null>> {
  try {
    const supabase = createClient();
    const { data: activity, error } = await supabase
      .from("activities")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: activity, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to log activity",
    };
  }
}
