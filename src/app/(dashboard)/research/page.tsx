"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { getResearches, deleteResearch } from "@/services/researches";
import { getPersons } from "@/services/persons";
import { getTrees } from "@/services/trees";
import { ResearchCard } from "@/components/research/research-card";
import { ResearchForm } from "@/components/research/research-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Plus, Search } from "lucide-react";
import { RESEARCH_STATUS_LABELS } from "@/types/constants";
import type { Research, Person } from "@/types";

export default function ResearchPage() {
  const { user, loading: userLoading } = useUser();
  const [researches, setResearches] = useState<Research[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingResearch, setEditingResearch] = useState<Research | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Research | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: families } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id);

      if (!families?.length) {
        setLoading(false);
        return;
      }

      const familyIds = families.map((m) => m.family_id);
      const { data: trees } = await supabase
        .from("trees")
        .select("id, family_id")
        .in("family_id", familyIds)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!trees?.length) {
        setLoading(false);
        return;
      }

      const tid = trees[0].id;
      setTreeId(tid);

      const [researchRes, personsRes] = await Promise.all([
        getResearches(trees[0].family_id),
        getPersons(tid),
      ]);

      if (researchRes.error) setError(researchRes.error);
      setResearches(researchRes.data);
      setPersons(personsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const personMap = new Map(persons.map((p) => [p.id, p]));

  const filteredResearches = researches.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const handleEdit = (research: Research) => {
    setEditingResearch(research);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deleteResearch(deleteConfirm.id);
    if (result.error) {
      setError(result.error);
    } else {
      await fetchData();
    }
    setDeleteConfirm(null);
  };

  const handleFormSaved = async () => {
    await fetchData();
    setEditingResearch(undefined);
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recherches généalogiques
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {researches.length} recherche{researches.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setEditingResearch(undefined); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nouvelle recherche
        </Button>
      </div>

      <ErrorMessage message={error} />

      <div className="max-w-xs">
        <Select
          label="Filtrer par statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "Tous les statuts" },
            ...Object.entries(RESEARCH_STATUS_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          placeholder="Tous les statuts"
        />
      </div>

      {researches.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="Aucune recherche"
              description="Créez des recherches pour documenter vos enquêtes généalogiques."
              action={
                <Button onClick={() => { setEditingResearch(undefined); setFormOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  Commencer une recherche
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredResearches.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucune recherche ne correspond au filtre sélectionné.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredResearches.map((research) => (
            <ResearchCard
              key={research.id}
              research={research}
              personName={
                research.person_id
                  ? (() => {
                      const p = personMap.get(research.person_id);
                      return p
                        ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
                        : undefined;
                    })()
                  : undefined
              }
              onEdit={handleEdit}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      {treeId && (
        <ResearchForm
          research={editingResearch}
          treeId={treeId}
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingResearch(undefined);
          }}
          onSaved={handleFormSaved}
        />
      )}

      <ConfirmationDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer la recherche"
        message={`Êtes-vous sûr de vouloir supprimer cette recherche ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </div>
  );
}
