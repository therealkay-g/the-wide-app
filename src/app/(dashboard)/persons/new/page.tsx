"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LoadingPage } from "@/components/ui/status";
import { ArrowLeft } from "lucide-react";

export default function NewPersonPage() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const [families, setFamilies] = useState<any[]>([]);
  const [trees, setTrees] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedTree, setSelectedTree] = useState("");
  const [loadingFamilies, setLoadingFamilies] = useState(true);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    post_name: "",
    nickname: "",
    traditional_name: "",
    gender: "",
    birth_date: "",
    birth_date_precision: "UNKNOWN",
    death_date: "",
    death_date_precision: "UNKNOWN",
    country: "RDC",
    province: "",
    city: "",
    territory: "",
    village: "",
    clan: "",
    lineage: "",
    family_origin: "",
    notes: "",
    certainty: "UNKNOWN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFamilies() {
      if (!user) return;
      const { data: memberFamilies } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id);
      if (!memberFamilies || memberFamilies.length === 0) { setLoadingFamilies(false); return; }
      const ids = memberFamilies.map((m: any) => m.family_id);
      const { data: fams } = await supabase
        .from("families")
        .select("id, name")
        .in("id", ids);
      setFamilies(fams || []);
      if (fams && fams.length === 1) {
        setSelectedFamily(fams[0].id);
      }
      setLoadingFamilies(false);
    }
    loadFamilies();
  }, [user]);

  useEffect(() => {
    async function loadTrees() {
      if (!selectedFamily) { setTrees([]); return; }
      const { data } = await supabase
        .from("trees")
        .select("id, name")
        .eq("family_id", selectedFamily);
      setTrees(data || []);
      if (data?.length === 1) setSelectedTree(data[0].id);
    }
    loadTrees();
  }, [selectedFamily]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTree) return;

    setLoading(true);
    setError("");

    const { data, error: personError } = await supabase
      .from("persons")
      .insert({
        tree_id: selectedTree,
        family_id: selectedFamily,
        first_name: form.first_name || null,
        middle_name: form.middle_name || null,
        last_name: form.last_name || null,
        post_name: form.post_name || null,
        nickname: form.nickname || null,
        traditional_name: form.traditional_name || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        birth_date_precision: form.birth_date_precision,
        death_date: form.death_date || null,
        death_date_precision: form.death_date_precision,
        country: form.country || null,
        province: form.province || null,
        city: form.city || null,
        territory: form.territory || null,
        village: form.village || null,
        clan: form.clan || null,
        lineage: form.lineage || null,
        family_origin: form.family_origin || null,
        notes: form.notes || null,
        certainty: form.certainty,
        created_by: user.id,
      })
      .select()
      .single();

    if (personError) {
      setError(personError.message);
      setLoading(false);
      return;
    }

    router.push(`/persons/${data.id}`);
  };

  if (loadingFamilies) return <LoadingPage />;

  if (families.length === 0) {
    return (
      <div className="space-y-4">
        <Link href="/families">
          <Button variant="ghost"><ArrowLeft className="h-4 w-4" /> Retour</Button>
        </Link>
        <Card><CardContent className="p-12 text-center">
          <p className="text-gray-500">Créez d&apos;abord une famille et un arbre.</p>
          <Link href="/families/new"><Button className="mt-4">Créer une famille</Button></Link>
        </CardContent></Card>
      </div>
    );
  }

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
        <Link href="/persons">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle personne</h1>
          <p className="text-gray-500 dark:text-gray-400">Ajoutez une personne à votre généalogie</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {families.length > 1 && (
          <Card><CardContent className="p-4 space-y-3">
            <Select label="Famille" value={selectedFamily} onChange={(e) => { setSelectedFamily(e.target.value); setSelectedTree(""); }}
              options={families.map((f) => ({ value: f.id, label: f.name }))} placeholder="Sélectionner..." />
          </CardContent></Card>
        )}

        {trees.length > 1 && (
          <Card><CardContent className="p-4 space-y-3">
            <Select label="Arbre" value={selectedTree} onChange={(e) => setSelectedTree(e.target.value)}
              options={trees.map((t) => ({ value: t.id, label: t.name }))} placeholder="Sélectionner..." />
          </CardContent></Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Identité</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" value={form.first_name} onChange={(e) => updateForm("first_name", e.target.value)} />
              <Input label="Nom de famille" value={form.last_name} onChange={(e) => updateForm("last_name", e.target.value)} />
              <Input label="Post-nom" value={form.post_name} onChange={(e) => updateForm("post_name", e.target.value)} />
              <Input label="Nom du milieu" value={form.middle_name} onChange={(e) => updateForm("middle_name", e.target.value)} />
              <Input label="Surnom" value={form.nickname} onChange={(e) => updateForm("nickname", e.target.value)} />
              <Input label="Nom traditionnel" value={form.traditional_name} onChange={(e) => updateForm("traditional_name", e.target.value)} />
            </div>
            <Select label="Genre" value={form.gender} onChange={(e) => updateForm("gender", e.target.value)}
              options={[{ value: "male", label: "Homme" }, { value: "female", label: "Femme" }, { value: "unknown", label: "Inconnu" }]}
              placeholder="Sélectionner..." />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Naissance</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" value={form.birth_date} onChange={(e) => updateForm("birth_date", e.target.value)} placeholder="1950 ou vers 1950" />
              <Select label="Précision" value={form.birth_date_precision} onChange={(e) => updateForm("birth_date_precision", e.target.value)} options={precisionOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Décès</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" value={form.death_date} onChange={(e) => updateForm("death_date", e.target.value)} />
              <Select label="Précision" value={form.death_date_precision} onChange={(e) => updateForm("death_date_precision", e.target.value)} options={precisionOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Origines</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Pays" value={form.country} onChange={(e) => updateForm("country", e.target.value)} />
              <Input label="Province" value={form.province} onChange={(e) => updateForm("province", e.target.value)} />
              <Input label="Ville" value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
              <Input label="Territoire" value={form.territory} onChange={(e) => updateForm("territory", e.target.value)} />
              <Input label="Village" value={form.village} onChange={(e) => updateForm("village", e.target.value)} />
              <Input label="Clan" value={form.clan} onChange={(e) => updateForm("clan", e.target.value)} />
              <Input label="Lignée" value={form.lineage} onChange={(e) => updateForm("lineage", e.target.value)} />
              <Input label="Famille d'origine" value={form.family_origin} onChange={(e) => updateForm("family_origin", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
            <Textarea label="Notes" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} placeholder="Informations supplémentaires..." />
            <Select label="Niveau de certitude" value={form.certainty} onChange={(e) => updateForm("certainty", e.target.value)}
              options={[
                { value: "UNKNOWN", label: "Inconnu" },
                { value: "HYPOTHESIS", label: "Hypothèse" },
                { value: "PROBABLE", label: "Probable" },
                { value: "FAMILY_TESTIMONY", label: "Témoignage familial" },
                { value: "CONFIRMED", label: "Confirmé" },
                { value: "VERIFIED", label: "Vérifié" },
              ]} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/persons" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Annuler</Button>
          </Link>
          <Button type="submit" className="flex-1" loading={loading} disabled={!selectedTree}>
            Ajouter la personne
          </Button>
        </div>
      </form>
    </div>
  );
}
