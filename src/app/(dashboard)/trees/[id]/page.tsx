"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTree } from "@/services/trees";
import { getPersons } from "@/services/persons";
import { TreeCanvas } from "@/components/trees/tree-canvas";
import {
  TreeToolbar,
  type ViewMode,
  type ExportFormat,
} from "@/components/trees/tree-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, X, Heart } from "lucide-react";
import type { Tree, Person, Union, UnionChildLink } from "@/types";

export default function TreeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [tree, setTree] = useState<Tree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [unions, setUnions] = useState<Union[]>([]);
  const [unionChildren, setUnionChildren] = useState<UnionChildLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [zoom, setZoom] = useState(1);
  const [maxGenerations, setMaxGenerations] = useState(10);
  const [searchHighlight, setSearchHighlight] = useState<string[]>([]);
  const [focusPersonId, setFocusPersonId] = useState<string | undefined>();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showUnionForm, setShowUnionForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [unionPersonA, setUnionPersonA] = useState("");
  const [unionPersonB, setUnionPersonB] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newGender, setNewGender] = useState<string>("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newProfession, setNewProfession] = useState("");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const treeResult = await getTree(id);
    if (treeResult.error || !treeResult.data) {
      setError(treeResult.error || "Arbre introuvable");
      setLoading(false);
      return;
    }
    setTree(treeResult.data);

    const personsResult = await getPersons(id);
    setPersons(personsResult.data);

    if (treeResult.data) {
      const { data: unionsData } = await supabase
        .from("unions")
        .select("*")
        .eq("family_id", treeResult.data.family_id);
      setUnions((unionsData ?? []) as Union[]);

      if (unionsData && unionsData.length > 0) {
        const unionIds = unionsData.map((u: Union) => u.id);
        const { data: ucData } = await supabase
          .from("union_children")
          .select("*")
          .in("union_id", unionIds);
        setUnionChildren((ucData ?? []) as UnionChildLink[]);
      }
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setSearchHighlight([]);
        return;
      }
      const pattern = `%${query}%`;
      const { data } = await supabase
        .from("persons")
        .select("id")
        .eq("tree_id", id)
        .or(
          `first_name.ilike.${pattern},last_name.ilike.${pattern},nickname.ilike.${pattern}`
        )
        .limit(20);
      setSearchHighlight((data ?? []).map((p: { id: string }) => p.id));
    },
    [id, supabase]
  );

  const handlePersonClick = useCallback(
    (personId: string) => {
      setFocusPersonId(personId);
      setSelectedPerson(persons.find((p) => p.id === personId) ?? null);
    },
    [persons]
  );

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.1)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.1, z - 0.1)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);
  const handlePrint = useCallback(() => window.print(), []);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      let content: string;
      let filename: string;
      let mime: string;

      if (format === "json") {
        content = JSON.stringify({ tree, persons, unions, unionChildren }, null, 2);
        filename = `${tree?.name ?? "arbre"}.json`;
        mime = "application/json";
      } else if (format === "csv") {
        const header = "id,first_name,last_name,gender,birth_date,death_date,is_alive";
        const rows = persons.map(
          (p) =>
            `${p.id},"${p.first_name ?? ""}","${p.last_name ?? ""}","${p.gender ?? ""}","${p.birth_date ?? ""}","${p.death_date ?? ""}",${p.is_alive}`
        );
        content = [header, ...rows].join("\n");
        filename = `${tree?.name ?? "arbre"}.csv`;
        mime = "text/csv";
      } else {
        content = "0 HEAD\n1 SOUR WIDE\n1 GEDC\n2 VERS 5.5.1\n1 CHAR UTF-8\n";
        filename = `${tree?.name ?? "arbre"}.ged`;
        mime = "text/plain";
      }

      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [tree, persons, unions, unionChildren]
  );

  const handleSavePerson = useCallback(async () => {
    if (!newFirstName.trim()) return;
    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("persons").insert({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim() || null,
        gender: newGender || null,
        birth_date: newBirthDate || null,
        profession: newProfession || null,
        tree_id: id,
        family_id: tree?.family_id,
        created_by: user?.id,
      });
      setShowPersonForm(false);
      resetPersonForm();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  }, [newFirstName, newLastName, newGender, newBirthDate, newProfession, id, tree, supabase, fetchData]);

  const resetPersonForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewGender("");
    setNewBirthDate("");
    setNewProfession("");
    setEditingPerson(undefined);
  };

  const handleSaveUnion = useCallback(async () => {
    if (!unionPersonA || !unionPersonB || !tree) return;
    setSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      await supabase.from("unions").insert({
        family_id: tree.family_id,
        person_a_id: unionPersonA,
        person_b_id: unionPersonB,
        union_type: "MARRIAGE",
        status: "ACTIVE",
        created_by: user?.id,
      });
      setShowUnionForm(false);
      setUnionPersonA("");
      setUnionPersonB("");
      fetchData();
    } finally {
      setSubmitting(false);
    }
  }, [unionPersonA, unionPersonB, tree, supabase, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="space-y-4">
        <Link href="/trees">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Retour aux arbres
          </Button>
        </Link>
        <ErrorMessage message={error || "Arbre introuvable"} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <Link href="/trees">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {tree.name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {persons.length}{" "}
                {persons.length === 1 ? "personne" : "personnes"}
              </Badge>
              {unions.length > 0 && (
                <Badge variant="info" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  {unions.length} {unions.length === 1 ? "union" : "unions"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <TreeToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onSearch={handleSearch}
        onPrint={handlePrint}
        onExport={handleExport}
        generationCount={maxGenerations}
        onMaxGenerationsChange={setMaxGenerations}
        onAddPerson={() => {
          resetPersonForm();
          setShowPersonForm(true);
        }}
        onAddUnion={() => {
          setUnionPersonA("");
          setUnionPersonB("");
          setShowUnionForm(true);
        }}
      />

      <div className="flex-1 min-h-0 relative">
        <TreeCanvas
          persons={persons}
          unions={unions}
          unionChildren={unionChildren}
          focusPersonId={focusPersonId}
          onPersonClick={handlePersonClick}
          maxGenerations={maxGenerations}
          searchHighlight={searchHighlight}
          onAddSpouse={(personId) => {
            setUnionPersonA(personId);
            setUnionPersonB("");
            setShowUnionForm(true);
          }}
          onAddChild={() => {
            resetPersonForm();
            setShowPersonForm(true);
          }}
        />

        {selectedPerson && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Fiche personne
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSelectedPerson(null);
                  setFocusPersonId(undefined);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {[selectedPerson.first_name, selectedPerson.last_name]
                    .filter(Boolean)
                    .join(" ") || "Inconnu"}
                </p>
                {selectedPerson.nickname && (
                  <p className="text-sm text-gray-500">
                    &ldquo;{selectedPerson.nickname}&rdquo;
                  </p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {selectedPerson.gender && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genre</span>
                    <span className="font-medium capitalize">
                      {selectedPerson.gender === "male"
                        ? "Homme"
                        : selectedPerson.gender === "female"
                          ? "Femme"
                          : selectedPerson.gender}
                    </span>
                  </div>
                )}
                {selectedPerson.birth_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Naissance</span>
                    <span className="font-medium">{selectedPerson.birth_date}</span>
                  </div>
                )}
                {selectedPerson.death_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Décès</span>
                    <span className="font-medium">{selectedPerson.death_date}</span>
                  </div>
                )}
                {selectedPerson.profession && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Profession</span>
                    <span className="font-medium">{selectedPerson.profession}</span>
                  </div>
                )}
                {selectedPerson.village && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Village</span>
                    <span className="font-medium">{selectedPerson.village}</span>
                  </div>
                )}
                {selectedPerson.clan && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Clan</span>
                    <span className="font-medium">{selectedPerson.clan}</span>
                  </div>
                )}
              </div>

              {(() => {
                const personUnions = unions.filter(
                  (u) =>
                    u.person_a_id === selectedPerson.id ||
                    u.person_b_id === selectedPerson.id
                );
                if (personUnions.length === 0) return null;
                return (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Heart className="h-3.5 w-3.5 inline mr-1" />
                      Unions ({personUnions.length})
                    </h3>
                    <div className="space-y-1">
                      {personUnions.map((u) => {
                        const partnerId =
                          u.person_a_id === selectedPerson.id
                            ? u.person_b_id
                            : u.person_a_id;
                        const partner = persons.find((p) => p.id === partnerId);
                        return (
                          <div
                            key={u.id}
                            className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => handlePersonClick(partnerId)}
                          >
                            <span className="font-medium">
                              {u.union_type.replace(/_/g, " ")}
                            </span>
                            <span className="text-gray-500 mx-1">&bull; {u.status}</span>
                            {partner && (
                              <span className="text-gray-700 dark:text-gray-300">
                                avec{" "}
                                {[partner.first_name, partner.last_name]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPerson(selectedPerson);
                    setNewFirstName(selectedPerson.first_name ?? "");
                    setNewLastName(selectedPerson.last_name ?? "");
                    setNewGender(selectedPerson.gender ?? "");
                    setNewBirthDate(selectedPerson.birth_date ?? "");
                    setNewProfession(selectedPerson.profession ?? "");
                    setShowPersonForm(true);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUnionPersonA(selectedPerson.id);
                    setUnionPersonB("");
                    setShowUnionForm(true);
                  }}
                >
                  Ajouter une union
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPersonForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPerson ? "Modifier la personne" : "Ajouter une personne"}
              </h2>
              <Button variant="ghost" size="icon-sm" onClick={() => { setShowPersonForm(false); resetPersonForm(); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prénom *</label>
                <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Prénom" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Nom de famille" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Genre</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                >
                  <option value="">Non spécifié</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de naissance</label>
                <Input type="date" value={newBirthDate} onChange={(e) => setNewBirthDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Profession</label>
                <Input value={newProfession} onChange={(e) => setNewProfession(e.target.value)} placeholder="Profession" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowPersonForm(false); resetPersonForm(); }}>
                Annuler
              </Button>
              <Button onClick={handleSavePerson} disabled={!newFirstName.trim() || submitting}>
                {submitting ? "Enregistrement..." : editingPerson ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUnionForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ajouter une union</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowUnionForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Personne 1</label>
                <select
                  value={unionPersonA}
                  onChange={(e) => setUnionPersonA(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {persons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Personne 2</label>
                <select
                  value={unionPersonB}
                  onChange={(e) => setUnionPersonB(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {persons
                    .filter((p) => p.id !== unionPersonA)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowUnionForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveUnion} disabled={!unionPersonA || !unionPersonB || submitting}>
                {submitting ? "Enregistrement..." : "Créer l'union"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
