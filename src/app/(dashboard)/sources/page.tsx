"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getSources, deleteSource } from "@/services/sources";
import { getFamilies } from "@/services/families";
import { getTrees } from "@/services/trees";
import { SourceCard } from "@/components/sources/source-card";
import { SourceForm } from "@/components/sources/source-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingPage } from "@/components/ui/status";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Source } from "@/types";

export default function SourcesPage() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | undefined>(undefined);

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
    const { data, error: srcErr } = await getSources(families[0].id);
    if (srcErr) setError(srcErr);
    else setSources(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    const { error: delErr } = await deleteSource(id);
    if (delErr) {
      setError(delErr);
      return;
    }
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  function handleEdit(source: Source) {
    setEditingSource(source);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingSource(undefined);
    setFormOpen(true);
  }

  const filtered = sources.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.author?.toLowerCase().includes(q) ?? false) ||
      (s.description?.toLowerCase().includes(q) ?? false)
    );
  });

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sources</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </p>
        </div>
        {treeId && (
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Ajouter une source
          </Button>
        )}
      </div>

      <ErrorMessage message={error} />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher une source..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="Aucune source"
              description="Ajoutez des sources pour documenter la fiabilité de vos informations."
              action={
                treeId ? (
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4" /> Ajouter une source
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="Aucun résultat"
              description="Aucune source ne correspond à votre recherche."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              isOwner={source.created_by === user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {treeId && (
        <SourceForm
          source={editingSource}
          treeId={treeId}
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingSource(undefined); }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
