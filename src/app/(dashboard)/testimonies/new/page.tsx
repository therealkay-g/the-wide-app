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
import { SOURCE_TYPE_LABELS, CERTAINTY_LABELS } from "@/types/constants";

export default function NewTestimonyPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    title: "", description: "", witness_name: "", witness_relation: "",
    language: "Français", testimony_date: "", transcription: "", certainty: "FAMILY_TESTIMONY",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { data: memberFamilies } = await supabase
      .from("family_members").select("family_id").eq("user_id", user.id).limit(1);
    if (!memberFamilies?.length) { setError("Aucune famille trouvée"); setLoading(false); return; }

    const { error: err } = await supabase.from("testimonies").insert({
      family_id: memberFamilies[0].family_id,
      title: form.title || null, description: form.description || null,
      witness_name: form.witness_name || null, witness_relation: form.witness_relation || null,
      language: form.language || null, testimony_date: form.testimony_date || null,
      transcription: form.transcription || null, certainty: form.certainty,
      created_by: user.id,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/testimonies");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/testimonies"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau témoignage</h1>
      </div>
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Titre" value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="Témoignage de..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom du témoin" value={form.witness_name} onChange={(e) => updateForm("witness_name", e.target.value)} />
            <Input label="Relation avec la famille" value={form.witness_relation} onChange={(e) => updateForm("witness_relation", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Langue" value={form.language} onChange={(e) => updateForm("language", e.target.value)} />
            <Input label="Date" value={form.testimony_date} onChange={(e) => updateForm("testimony_date", e.target.value)} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Description du témoignage..." />
          <Textarea label="Transcription" value={form.transcription} onChange={(e) => updateForm("transcription", e.target.value)} placeholder="Transcription du témoignage..." />
          <Select label="Certitude" value={form.certainty} onChange={(e) => updateForm("certainty", e.target.value)}
            options={Object.entries(CERTAINTY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="flex gap-3">
            <Link href="/testimonies" className="flex-1"><Button type="button" variant="outline" className="w-full">Annuler</Button></Link>
            <Button type="submit" className="flex-1" loading={loading}>Enregistrer</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
