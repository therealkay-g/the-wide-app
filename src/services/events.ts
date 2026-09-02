import { createClient } from "@/lib/supabase/client";
import type { Event, EventType, DatePrecision } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

interface TimelineFilters {
  startDate?: string;
  endDate?: string;
  types?: EventType[];
}

export async function getEventsByPerson(
  personId: string
): Promise<ServiceResult<Event[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("person_id", personId)
      .order("date_value", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch events",
    };
  }
}

export async function getEventsByTree(
  familyId: string
): Promise<ServiceResult<Event[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("family_id", familyId)
      .order("date_value", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch events",
    };
  }
}

export async function createEvent(
  data: Omit<Event, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Event | null>> {
  try {
    const supabase = createClient();
    const { data: event, error } = await supabase
      .from("events")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: event, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create event",
    };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
): Promise<ServiceResult<Event | null>> {
  try {
    const supabase = createClient();
    const { data: event, error } = await supabase
      .from("events")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: event, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update event",
    };
  }
}

export async function deleteEvent(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete event",
    };
  }
}

export async function getTimeline(
  familyId: string,
  filters: TimelineFilters = {}
): Promise<ServiceResult<Event[]>> {
  try {
    const supabase = createClient();
    let builder = supabase
      .from("events")
      .select("*")
      .eq("family_id", familyId);

    if (filters.startDate) {
      builder = builder.gte("date_value", filters.startDate);
    }

    if (filters.endDate) {
      builder = builder.lte("date_value", filters.endDate);
    }

    if (filters.types && filters.types.length > 0) {
      builder = builder.in("event_type", filters.types);
    }

    const { data, error } = await builder.order("date_value", { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch timeline",
    };
  }
}
