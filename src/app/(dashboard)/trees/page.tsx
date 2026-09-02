"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { getTrees } from "@/services/trees";
import { getPersons } from "@/services/persons";
import { getFamilies } from "@/services/families";
import { TreeCard } from "@/components/trees/tree-card";
import { CreateTreeDialog } from "@/components/trees/create-tree-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState, LoadingPage } from "@/components/ui/status";
import { TreePine, Plus } from "lucide-react";
import type { Tree, Family } from "@/types";

export default function TreesPage() {
  const { user, loading: userLoading } = useUser();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [trees, setTrees] = useState<Tree[]>([]);
  const [personCounts, setPersonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchFamilies = useCallback(async () => {
    if (!user) return;
    const result = await getFamilies(user.id);
    if (result.data) {
      setFamilies(result.data);
      if (result.data.length > 0 && !selectedFamilyId) {
        setSelectedFamilyId(result.data[0].id);
      }
    }
  }, [user, selectedFamilyId]);

  const fetchTrees = useCallback(async () => {
    if (!selectedFamilyId) {
      setTrees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getTrees(selectedFamilyId);
    setTrees(result.data);

    const counts: Record<string, number> = {};
    await Promise.all(
      result.data.map(async (tree) => {
        const personsResult = await getPersons(tree.id, { pageSize: 0 });
        counts[tree.id] = personsResult.data.length;
      })
    );
    setPersonCounts(counts);
    setLoading(false);
  }, [selectedFamilyId]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  if (userLoading || loading) return <LoadingPage />;

  const familyOptions = families.map((f) => ({ value: f.id, label: f.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Arbres généalogiques
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualisez et gérez vos arbres familiaux
          </p>
        </div>
        {families.length > 0 && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Créer un arbre
          </Button>
        )}
      </div>

      {families.length > 1 && (
        <div className="max-w-xs">
          <Select
            label="Famille"
            value={selectedFamilyId}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            options={familyOptions}
          />
        </div>
      )}

      {families.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12">
          <EmptyState
            icon={<TreePine className="h-12 w-12" />}
            title="Aucune famille"
            description="Créez d'abord une famille pour pouvoir créer des arbres généalogiques."
            action={
              <Link href="/families/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Créer une famille
                </Button>
              </Link>
            }
          />
        </div>
      ) : trees.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12">
          <EmptyState
            icon={<TreePine className="h-12 w-12" />}
            title="Aucun arbre"
            description="Commencez par créer un arbre généalogique pour visualiser votre lignée familiale."
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                Créer un arbre
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trees.map((tree) => (
            <Link key={tree.id} href={`/trees/${tree.id}`}>
              <TreeCard
                tree={tree}
                personCount={personCounts[tree.id] ?? 0}
              />
            </Link>
          ))}
        </div>
      )}

      {user && (
        <CreateTreeDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          families={families}
          defaultFamilyId={selectedFamilyId}
          userId={user.id}
          onCreated={(tree) => {
            setTrees((prev) => [tree, ...prev]);
            setPersonCounts((prev) => ({ ...prev, [tree.id]: 0 }));
          }}
        />
      )}
    </div>
  );
}
