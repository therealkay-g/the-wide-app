"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-project-url") {
    if (typeof window === "undefined") {
      return null as unknown as ReturnType<typeof createBrowserClient>;
    }
  }

  client = createBrowserClient(url || "http://localhost:54321", key || "placeholder");
  return client;
}
