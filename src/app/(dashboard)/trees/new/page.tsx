"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, TreePine } from "lucide-react";

export default function NewTreePage() {
  const searchParams = useSearchParams();
  const familyId = searchParams.get("family");
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState(familyId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("family");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchFamilies() {
      if (!user) return;
      const { data: memberData } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id);
      if (!memberData || memberData.length === 0) return;
      const ids = memberData.map((m: any) => m.family_id);
      const { data } = await supabase
        .from("families")
        .select("id, name")
        .in("id", ids);
      setFamilies(data || []);
    }
    fetchFamilies();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("Utilisateur non connecté"); return; }
    if (!selectedFamily) { setError("Veuillez sélectionner une famille"); return; }

    setLoading(true);
    setError("");

    const { data: tree, error: treeError } = await supabase
      .from("trees")
      .insert({
        family_id: selectedFamily,
        name,
        description: description || null,
        visibility: visibility as any,
        created_by: user.id,
      })
      .select()
      .single();

    if (treeError) {
      setError(treeError.message);
      setLoading(false);
      return;
    }

    await supabase.from("activities").insert({
      family_id: selectedFamily,
      user_id: user.id,
      action: "a créé l'arbre",
      entity_type: "tree",
      entity_id: tree.id,
      entity_name: tree.name,
    });

    router.push(`/trees/${tree.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={familyId ? `/families/${familyId}` : "/trees"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouvel arbre généalogique
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez un arbre pour documenter votre lignée familiale
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!familyId && (
              <Select
                label="Famille"
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                options={families.map((f) => ({ value: f.id, label: f.name }))}
                placeholder="Sélectionner une famille"
                required
              />
            )}

            <Input
              label="Nom de l'arbre"
              placeholder="Arbre de la famille Kabila"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              label="Description (optionnel)"
              placeholder="Description de l'arbre..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Select
              label="Visibilité"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              options={[
                { value: "private", label: "Privé" },
                { value: "family", label: "Famille" },
                { value: "public", label: "Public" },
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" loading={loading}>
                <TreePine className="h-4 w-4" />
                Créer l&apos;arbre
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
