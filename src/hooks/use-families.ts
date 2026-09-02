"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import type { Tables } from "@/types/database";

export function useFamilies() {
  const [families, setFamilies] = useState<Tables<"families">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("families")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setFamilies(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  return { families, loading, error, refresh: fetchFamilies };
}

export function useFamily(familyId: string | null) {
  const [family, setFamily] = useState<Tables<"families"> | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    async function fetchFamily() {
      const { data, error: err } = await supabase
        .from("families")
        .select("*")
        .eq("id", familyId)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setFamily(data);

        const { data: memberData } = await supabase
          .from("family_members")
          .select("*")
          .eq("family_id", familyId);

        let enriched = memberData || [];
        if (enriched.length > 0) {
          const userIds = [...new Set(enriched.map((m: any) => m.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url")
            .in("id", userIds);
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
          enriched = enriched.map((m: any) => ({
            ...m,
            profiles: profileMap.get(m.user_id) || null,
          }));
        }

        setMembers(enriched);
      }
      setLoading(false);
    }

    fetchFamily();
  }, [familyId]);

  return { family, members, loading, error };
}
