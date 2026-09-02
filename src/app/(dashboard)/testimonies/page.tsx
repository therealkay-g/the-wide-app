"use client";

import { useEffect, useState, useCallback } from "react";
import { Mic, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getTestimonies, deleteTestimony } from "@/services/testimonies";
import { getFamilies } from "@/services/families";
import { getTrees } from "@/services/trees";
import { TestimonyCard } from "@/components/testimonies/testimony-card";
import { TestimonyForm } from "@/components/testimonies/testimony-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingPage } from "@/components/ui/status";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Testimony } from "@/types";

export default function TestimoniesPage() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTestimony, setEditingTestimony] = useState<Testimony | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: families, error: famErr } = await getFamilies(user.id);
    if (famErr || families.length === 0) {
      setError(famErr ?? "Aucune famille trouvée.");
      setLoading(false);
      return;
    }
    const { data: trees, error: treeErr } = await getTrees(families[0].id);
    if (treeErr || trees.length === 0) {
      setError(treeErr ?? "Aucun arbre trouvé.");
      setLoading(false);
      return;
    }
    const tId = trees[0].id;
    setTreeId(tId);
    const { data, error: testErr } = await getTestimonies(families[0].id);
    if (testErr) setError(testErr);
    else setTestimonies(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    const { error: delErr } = await deleteTestimony(id);
    if (delErr) {
      setError(delErr);
      return;
    }
    setTestimonies((prev) => prev.filter((t) => t.id !== id));
  }

  function handleEdit(testimony: Testimony) {
    setEditingTestimony(testimony);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingTestimony(undefined);
    setFormOpen(true);
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Témoignages</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {testimonies.length} témoignage{testimonies.length !== 1 ? "s" : ""}
          </p>
        </div>
        {treeId && (
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Enregistrer un témoignage
          </Button>
        )}
      </div>

      <ErrorMessage message={error} />

      {testimonies.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Mic className="h-12 w-12" />}
              title="Aucun témoignage"
              description="Enregistrez les paroles des anciens pour préserver la mémoire familiale."
              action={
                treeId ? (
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4" /> Ajouter un témoignage
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonies.map((testimony) => (
            <TestimonyCard
              key={testimony.id}
              testimony={testimony}
              isOwner={testimony.created_by === user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {treeId && (
        <TestimonyForm
          testimony={editingTestimony}
          treeId={treeId}
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingTestimony(undefined); }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
