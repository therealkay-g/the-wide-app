import { createClient } from "@/lib/supabase/client";
import type { Testimony } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getTestimonies(
  familyId: string
): Promise<ServiceResult<Testimony[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonies")
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
      error: err instanceof Error ? err.message : "Failed to fetch testimonies",
    };
  }
}

export async function getTestimony(
  id: string
): Promise<ServiceResult<Testimony | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("testimonies")
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
      error: err instanceof Error ? err.message : "Failed to fetch testimony",
    };
  }
}

export async function createTestimony(
  data: Omit<Testimony, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Testimony | null>> {
  try {
    const supabase = createClient();
    const { data: testimony, error } = await supabase
      .from("testimonies")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: testimony, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create testimony",
    };
  }
}

export async function updateTestimony(
  id: string,
  data: Partial<Omit<Testimony, "id" | "created_at" | "updated_at">>
): Promise<ServiceResult<Testimony | null>> {
  try {
    const supabase = createClient();
    const { data: testimony, error } = await supabase
      .from("testimonies")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: testimony, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update testimony",
    };
  }
}

export async function deleteTestimony(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();

    const { data: testimony } = await supabase
      .from("testimonies")
      .select("audio_path")
      .eq("id", id)
      .single();

    if (testimony?.audio_path) {
      await supabase.storage
        .from("audio")
        .remove([testimony.audio_path]);
    }

    const { error } = await supabase
      .from("testimonies")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete testimony",
    };
  }
}

export async function uploadAudio(
  file: File,
  familyId: string,
  testimonyId: string
): Promise<ServiceResult<string | null>> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const storagePath = `${familyId}/${testimonyId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    const { error: updateError } = await supabase
      .from("testimonies")
      .update({
        audio_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testimonyId);

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    return { data: storagePath, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to upload audio",
    };
  }
}
