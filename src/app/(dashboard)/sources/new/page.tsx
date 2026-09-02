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

export default function NewSourcePage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    title: "", type: "OTHER", author: "", institution: "", date: "",
    reference_number: "", url: "", description: "", reliability: "UNKNOWN",
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

    const { error: err } = await supabase.from("sources").insert({
      family_id: memberFamilies[0].family_id, title: form.title, type: form.type as any,
      author: form.author || null, institution: form.institution || null,
      date: form.date || null, reference_number: form.reference_number || null,
      url: form.url || null, description: form.description || null,
      reliability: form.reliability as any, created_by: user.id,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/sources");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sources"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle source</h1>
      </div>
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Titre" value={form.title} onChange={(e) => updateForm("title", e.target.value)} required />
          <Select label="Type" value={form.type} onChange={(e) => updateForm("type", e.target.value)}
            options={Object.entries(SOURCE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Auteur" value={form.author} onChange={(e) => updateForm("author", e.target.value)} />
            <Input label="Institution" value={form.institution} onChange={(e) => updateForm("institution", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} />
            <Input label="Référence" value={form.reference_number} onChange={(e) => updateForm("reference_number", e.target.value)} />
          </div>
          <Input label="URL" value={form.url} onChange={(e) => updateForm("url", e.target.value)} placeholder="https://..." />
          <Textarea label="Description" value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
          <Select label="Fiabilité" value={form.reliability} onChange={(e) => updateForm("reliability", e.target.value)}
            options={Object.entries(CERTAINTY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <div className="flex gap-3">
            <Link href="/sources" className="flex-1"><Button type="button" variant="outline" className="w-full">Annuler</Button></Link>
            <Button type="submit" className="flex-1" loading={loading}>Enregistrer</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
