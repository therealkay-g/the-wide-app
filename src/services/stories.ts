import { createClient } from "@/lib/supabase/client";
import type { Story, StorySection } from "@/types";

interface ServiceResult<T> {
  data: T;
  error: string | null;
}

interface StoryWithSections extends Story {
  sections?: StorySection[];
}

export async function getStories(
  familyId: string
): Promise<ServiceResult<Story[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stories")
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
      error: err instanceof Error ? err.message : "Failed to fetch stories",
    };
  }
}

export async function getStory(
  id: string
): Promise<ServiceResult<StoryWithSections | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*, story_sections(*)")
      .eq("id", id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const raw = data as Record<string, unknown>;
    const sections = Array.isArray(raw.story_sections)
      ? (raw.story_sections as StorySection[]).sort(
          (a, b) => a.order_index - b.order_index
        )
      : undefined;

    const story: StoryWithSections = {
      ...(data as Story),
      sections,
    };

    return { data: story, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to fetch story",
    };
  }
}

export async function createStory(
  data: Omit<Story, "id" | "created_at" | "updated_at">
): Promise<ServiceResult<Story | null>> {
  try {
    const supabase = createClient();
    const { data: story, error } = await supabase
      .from("stories")
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: story, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create story",
    };
  }
}

export async function updateStory(
  id: string,
  data: Partial<Omit<Story, "id" | "created_at" | "updated_at">>
): Promise<ServiceResult<Story | null>> {
  try {
    const supabase = createClient();
    const { data: story, error } = await supabase
      .from("stories")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: story, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update story",
    };
  }
}

export async function deleteStory(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("stories").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete story",
    };
  }
}

export async function addSection(
  storyId: string,
  section: Omit<StorySection, "id" | "story_id" | "created_at">
): Promise<ServiceResult<StorySection | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("story_sections")
      .insert({ ...section, story_id: storyId })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to add section",
    };
  }
}

export async function updateSection(
  id: string,
  section: Partial<Omit<StorySection, "id" | "story_id" | "created_at">>
): Promise<ServiceResult<StorySection | null>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("story_sections")
      .update(section)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update section",
    };
  }
}

export async function deleteSection(
  id: string
): Promise<ServiceResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("story_sections")
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete section",
    };
  }
}
