"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LoadingPage } from "@/components/ui/status";
import { ArrowLeft } from "lucide-react";

export default function EditPersonPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params.id as string;
  const supabase = createClient();

  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPerson() {
      const { data } = await supabase.from("persons").select("*").eq("id", personId).single();
      setPerson(data);
      setLoading(false);
    }
    fetchPerson();
  }, [personId]);

  const updateField = (field: string, value: string) => {
    setPerson((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("persons")
      .update({
        first_name: person.first_name,
        middle_name: person.middle_name,
        last_name: person.last_name,
        post_name: person.post_name,
        nickname: person.nickname,
        traditional_name: person.traditional_name,
        gender: person.gender,
        birth_date: person.birth_date,
        birth_date_precision: person.birth_date_precision,
        death_date: person.death_date,
        death_date_precision: person.death_date_precision,
        country: person.country,
        province: person.province,
        city: person.city,
        territory: person.territory,
        village: person.village,
        clan: person.clan,
        lineage: person.lineage,
        family_origin: person.family_origin,
        notes: person.notes,
        certainty: person.certainty,
      })
      .eq("id", personId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(`/persons/${personId}`);
  };

  if (loading) return <LoadingPage />;
  if (!person) return <div>Personne non trouvée</div>;

  const precisionOptions = [
    { value: "EXACT", label: "Exacte" },
    { value: "YEAR", label: "Année" },
    { value: "APPROXIMATE", label: "Approximative" },
    { value: "BEFORE", label: "Avant" },
    { value: "AFTER", label: "Après" },
    { value: "UNKNOWN", label: "Inconnue" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/persons/${personId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Modifier {person.first_name} {person.last_name}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Identité</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" value={person.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)} />
              <Input label="Nom" value={person.last_name || ""} onChange={(e) => updateField("last_name", e.target.value)} />
              <Input label="Post-nom" value={person.post_name || ""} onChange={(e) => updateField("post_name", e.target.value)} />
              <Input label="Nom du milieu" value={person.middle_name || ""} onChange={(e) => updateField("middle_name", e.target.value)} />
              <Input label="Surnom" value={person.nickname || ""} onChange={(e) => updateField("nickname", e.target.value)} />
              <Input label="Nom traditionnel" value={person.traditional_name || ""} onChange={(e) => updateField("traditional_name", e.target.value)} />
            </div>
            <Select
              label="Genre"
              value={person.gender || ""}
              onChange={(e) => updateField("gender", e.target.value)}
              options={[
                { value: "male", label: "Homme" },
                { value: "female", label: "Femme" },
                { value: "unknown", label: "Inconnu" },
              ]}
              placeholder="Sélectionner..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Naissance</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" value={person.birth_date || ""} onChange={(e) => updateField("birth_date", e.target.value)} />
              <Select label="Précision" value={person.birth_date_precision || "UNKNOWN"} onChange={(e) => updateField("birth_date_precision", e.target.value)} options={precisionOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Décès</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" value={person.death_date || ""} onChange={(e) => updateField("death_date", e.target.value)} />
              <Select label="Précision" value={person.death_date_precision || "UNKNOWN"} onChange={(e) => updateField("death_date_precision", e.target.value)} options={precisionOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Origines</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pays" value={person.country || ""} onChange={(e) => updateField("country", e.target.value)} />
              <Input label="Province" value={person.province || ""} onChange={(e) => updateField("province", e.target.value)} />
              <Input label="Ville" value={person.city || ""} onChange={(e) => updateField("city", e.target.value)} />
              <Input label="Territoire" value={person.territory || ""} onChange={(e) => updateField("territory", e.target.value)} />
              <Input label="Village" value={person.village || ""} onChange={(e) => updateField("village", e.target.value)} />
              <Input label="Clan" value={person.clan || ""} onChange={(e) => updateField("clan", e.target.value)} />
              <Input label="Lignée" value={person.lineage || ""} onChange={(e) => updateField("lineage", e.target.value)} />
              <Input label="Famille d'origine" value={person.family_origin || ""} onChange={(e) => updateField("family_origin", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Notes</h2>
            <Textarea label="Notes" value={person.notes || ""} onChange={(e) => updateField("notes", e.target.value)} />
            <Select
              label="Certitude"
              value={person.certainty || "UNKNOWN"}
              onChange={(e) => updateField("certainty", e.target.value)}
              options={[
                { value: "UNKNOWN", label: "Inconnu" },
                { value: "HYPOTHESIS", label: "Hypothèse" },
                { value: "PROBABLE", label: "Probable" },
                { value: "FAMILY_TESTIMONY", label: "Témoignage familial" },
                { value: "CONFIRMED", label: "Confirmé" },
                { value: "VERIFIED", label: "Vérifié" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href={`/persons/${personId}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full">Annuler</Button>
          </Link>
          <Button type="submit" className="flex-1" loading={saving}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
