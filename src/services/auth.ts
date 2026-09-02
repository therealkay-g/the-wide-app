import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getCurrentUser(): Promise<ServiceResult<User | null>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: user, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to get current user",
    };
  }
}

export async function requireAuth(): Promise<ServiceResult<User>> {
  const { data: user, error } = await getCurrentUser();

  if (error || !user) {
    throw new Error(error ?? "Authentication required");
  }

  return { data: user, error: null };
}
