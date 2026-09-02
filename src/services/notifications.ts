import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

export async function getNotifications(
  userId: string
): Promise<ServiceResult<Notification[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch notifications",
    };
  }
}

export async function markAsRead(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to mark notification as read",
    };
  }
}

export async function markAllAsRead(
  userId: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to mark all notifications as read",
    };
  }
}

export async function getUnreadCount(
  userId: string
): Promise<ServiceResult<number>> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      return { data: 0, error: error.message };
    }

    return { data: count ?? 0, error: null };
  } catch (err) {
    return {
      data: 0,
      error: err instanceof Error ? err.message : "Failed to get unread count",
    };
  }
}
