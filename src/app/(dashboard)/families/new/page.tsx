"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewFamilyPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({
        name,
        description: description || null,
        privacy: privacy as any,
        owner_id: user.id,
      })
      .select()
      .single();

    if (familyError) {
      setError(familyError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: family.id,
        user_id: user.id,
        role: "OWNER",
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    await supabase.from("activities").insert({
      family_id: family.id,
      user_id: user.id,
      action: "a créé la famille",
      entity_type: "family",
      entity_id: family.id,
      entity_name: family.name,
    });

    router.push(`/families/${family.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/families">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouvelle famille
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créez une nouvelle famille pour votre arbre généalogique
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Nom de la famille"
              placeholder="Famille Kabila"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Textarea
              label="Description (optionnel)"
              placeholder="Description de la famille, histoire, origines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Select
              label="Confidentialité"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              options={[
                { value: "private", label: "Privé - Visible uniquement par vous" },
                { value: "family", label: "Famille - Visible par les membres de la famille" },
                { value: "public", label: "Public - Visible par tous" },
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Link href="/families" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" className="flex-1" loading={loading}>
                Créer la famille
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
