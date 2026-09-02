"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFilterBuilder = any;

interface UseSupabaseQueryOptions<T> {
  table: string;
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  enabled?: boolean;
  single?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onQuery?: (builder: any) => any;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSupabaseQuery<T = unknown>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryResult<T> {
  const {
    table,
    select = "*",
    filters,
    orderBy,
    limit,
    offset,
    enabled = true,
    single = false,
    onQuery,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let builder = supabase.from(table).select(select);

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            builder = builder.eq(key, value);
          }
        }
      }

      if (onQuery) {
        builder = onQuery(builder) as typeof builder;
      }

      if (orderBy) {
        builder = builder.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      if (limit !== undefined) {
        builder = builder.limit(limit);
      }

      if (offset !== undefined) {
        builder = builder.range(offset, offset + (limit ?? 50) - 1);
      }

      const { data: result, error: queryError } = single
        ? await builder.single()
        : await builder;

      if (queryError) {
        setError(queryError.message);
      } else {
        setData(result as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), JSON.stringify(orderBy), limit, offset, enabled, single, onQuery, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
