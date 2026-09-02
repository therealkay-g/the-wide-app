import { createClient } from "@/lib/supabase/client";
import type { Document, DocumentCategory } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getDocuments(
  familyId: string
): Promise<ServiceResult<Document[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
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
      error: err instanceof Error ? err.message : "Failed to fetch documents",
    };
  }
}

export async function uploadDocument(
  file: File,
  familyId: string,
  ownerId: string,
  metadata: {
    category: DocumentCategory;
    description?: string;
  }
): Promise<ServiceResult<Document | null>> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const storagePath = `${familyId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file);

    if (uploadError) {
      return { data: null, error: uploadError.message };
    }

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        family_id: familyId,
        owner_id: ownerId,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        category: metadata.category,
        description: metadata.description ?? null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: insertError.message };
    }

    return { data: doc, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to upload document",
    };
  }
}

export async function deleteDocument(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    await supabase.storage.from("documents").remove([doc.storage_path]);

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return { data: null, error: deleteError.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete document",
    };
  }
}

export async function getDocumentUrl(
  storagePath: string
): Promise<ServiceResult<string | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(storagePath, 3600);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data.signedUrl, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to get document URL",
    };
  }
}
