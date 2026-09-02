"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import type { Tables } from "@/types/database";

export function usePersons(familyId: string | null, treeId?: string | null) {
  const [persons, setPersons] = useState<Tables<"persons">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPersons = useCallback(async () => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from("persons")
      .select("*")
      .eq("family_id", familyId)
      .order("last_name", { ascending: true });

    if (treeId) {
      query = query.eq("tree_id", treeId);
    }

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      setPersons(data || []);
    }
    setLoading(false);
  }, [familyId, treeId]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  return { persons, loading, error, refresh: fetchPersons };
}

export function usePerson(personId: string | null) {
  const [person, setPerson] = useState<Tables<"persons"> | null>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [events, setEvents] = useState<Tables<"events">[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchPerson = useCallback(async () => {
    if (!personId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error: err } = await supabase
      .from("persons")
      .select("*")
      .eq("id", personId)
      .single();

    if (err) {
      setError(err.message);
    } else {
      setPerson(data);

      const [relRes, evtRes] = await Promise.all([
        supabase
          .from("relationships")
          .select("*, related_person:related_person_id(id, first_name, last_name, gender, birth_date, death_date, profile_photo)")
          .eq("person_id", personId),
        supabase
          .from("events")
          .select("*")
          .eq("person_id", personId)
          .order("date_value", { ascending: true }),
      ]);

      setRelationships(relRes.data || []);
      setEvents(evtRes.data || []);
    }
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  return { person, relationships, events, documents, loading, error, refresh: fetchPerson };
}
