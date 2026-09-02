"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { RESEARCH_STATUS_LABELS } from "@/types/constants";

export default function NewResearchPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    question: "", hypothesis: "", period_start: "", period_end: "",
    place: "", sources_consulted: "", results: "", status: "TODO",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data: mf } = await supabase.from("family_members").select("family_id").eq("user_id", user.id).limit(1);
    if (!mf?.length) { setError("Aucune famille"); setLoading(false); return; }
    const { error: err } = await supabase.from("researches").insert({
      family_id: mf[0].family_id, question: form.question, hypothesis: form.hypothesis || null,
      period_start: form.period_start || null, period_end: form.period_end || null,
      place: form.place || null, sources_consulted: form.sources_consulted || null,
      results: form.results || null, status: form.status as any, created_by: user.id,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/research");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/research"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle recherche</h1>
      </div>
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <Textarea label="Question de recherche" value={form.question} onChange={(e) => updateForm("question", e.target.value)} required placeholder="Quelle est l'origine de la famille..." />
          <Textarea label="Hypothèse" value={form.hypothesis} onChange={(e) => updateForm("hypothesis", e.target.value)} placeholder="Hypothèse de recherche..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Période début" value={form.period_start} onChange={(e) => updateForm("period_start", e.target.value)} placeholder="1900" />
            <Input label="Période fin" value={form.period_end} onChange={(e) => updateForm("period_end", e.target.value)} placeholder="1950" />
          </div>
          <Input label="Lieu" value={form.place} onChange={(e) => updateForm("place", e.target.value)} />
          <Textarea label="Sources consultées" value={form.sources_consulted} onChange={(e) => updateForm("sources_consulted", e.target.value)} />
          <Textarea label="Résultats" value={form.results} onChange={(e) => updateForm("results", e.target.value)} />
          <Select label="Statut" value={form.status} onChange={(e) => updateForm("status", e.target.value)}
            options={Object.entries(RESEARCH_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="flex gap-3">
            <Link href="/research" className="flex-1"><Button type="button" variant="outline" className="w-full">Annuler</Button></Link>
            <Button type="submit" className="flex-1" loading={loading}>Enregistrer</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
