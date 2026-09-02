import { createClient } from "@/lib/supabase/client";
import type {
  Family,
  FamilyMember,
  FamilyRole,
  Profile,
} from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

interface FamilyMemberWithProfile extends FamilyMember {
  profiles: Profile;
}

interface InvitationResult {
  id: string;
}

export async function getFamilies(
  userId: string
): Promise<ServiceResult<Family[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_members")
      .select("families(*)")
      .eq("user_id", userId);

    if (error) {
      return { data: [], error: error.message };
    }

    const families = (data ?? []).map(
      (row: { families: any }) => row.families as Family
    );
    return { data: families, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch families",
    };
  }
}

export async function getFamily(
  id: string
): Promise<ServiceResult<Family | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("families")
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
      error: err instanceof Error ? err.message : "Failed to fetch family",
    };
  }
}

export async function createFamily(
  data: Pick<Family, "name" | "description" | "privacy"> & {
    owner_id: string;
  }
): Promise<ServiceResult<Family | null>> {
  try {
    const supabase = createClient();

    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({
        name: data.name,
        description: data.description,
        privacy: data.privacy,
        owner_id: data.owner_id,
      })
      .select()
      .single();

    if (familyError) {
      return { data: null, error: familyError.message };
    }

    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: family.id,
        user_id: data.owner_id,
        role: "OWNER" as FamilyRole,
      });

    if (memberError) {
      return { data: null, error: memberError.message };
    }

    return { data: family, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create family",
    };
  }
}

export async function updateFamily(
  id: string,
  data: Partial<Pick<Family, "name" | "description" | "photo_url" | "privacy" | "origin_place_id">>
): Promise<ServiceResult<Family | null>> {
  try {
    const supabase = createClient();
    const { data: family, error } = await supabase
      .from("families")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: family, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update family",
    };
  }
}

export async function deleteFamily(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("families").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete family",
    };
  }
}

export async function getFamilyMembers(
  familyId: string
): Promise<ServiceResult<FamilyMemberWithProfile[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("family_id", familyId);

    if (error) {
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const userIds = [...new Set(data.map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const result = data.map((m: any) => ({
      ...m,
      profiles: profileMap.get(m.user_id) || null,
    }));

    return { data: result as FamilyMemberWithProfile[], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch family members",
    };
  }
}

export async function inviteToFamily(
  familyId: string,
  email: string,
  role: FamilyRole,
  inviterId: string
): Promise<ServiceResult<InvitationResult | null>> {
  try {
    const supabase = createClient();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        family_id: familyId,
        invited_by: inviterId,
        email,
        role,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create invitation",
    };
  }
}
