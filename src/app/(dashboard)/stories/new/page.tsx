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

export default function NewStoryPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({ title: "", content: "", visibility: "family" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data: mf } = await supabase.from("family_members").select("family_id").eq("user_id", user.id).limit(1);
    if (!mf?.length) { setError("Aucune famille"); setLoading(false); return; }
    const { error: err } = await supabase.from("stories").insert({
      family_id: mf[0].family_id, title: form.title, content: form.content || null,
      visibility: form.visibility as any, author_id: user.id,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/stories");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stories"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle histoire</h1>
      </div>
      <Card><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <Input label="Titre" value={form.title} onChange={(e) => updateForm("title", e.target.value)} required placeholder="L'histoire de..." />
          <Textarea label="Contenu" value={form.content} onChange={(e) => updateForm("content", e.target.value)} placeholder="Racontez l'histoire..." />
          <Select label="Visibilité" value={form.visibility} onChange={(e) => updateForm("visibility", e.target.value)}
            options={[{ value: "private", label: "Privé" }, { value: "family", label: "Famille" }, { value: "public", label: "Public" }]} />
          <div className="flex gap-3">
            <Link href="/stories" className="flex-1"><Button type="button" variant="outline" className="w-full">Annuler</Button></Link>
            <Button type="submit" className="flex-1" loading={loading}>Publier</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}
