"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { PersonCard } from "@/components/persons/person-card";
import { PersonForm } from "@/components/persons/person-form";
import { getPersons, searchPersons } from "@/services/persons";
import { getFamilies } from "@/services/families";
import { getTrees } from "@/services/trees";
import { useAuth } from "@/hooks/use-auth";
import type { Person, Tree } from "@/types";
import { Plus, Users, Search, X } from "lucide-react";

export default function PersonsPage() {
  const { user, loading: authLoading } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeId, setTreeId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const fetchTreeAndPersons = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: families } = await getFamilies(user.id);
    if (!families.length) {
      setLoading(false);
      return;
    }

    const familyIds = families.map((f) => f.id);
    let allTrees: Tree[] = [];
    for (const fid of familyIds) {
      const { data: trees } = await getTrees(fid);
      allTrees = allTrees.concat(trees);
    }

    if (!allTrees.length) {
      setLoading(false);
      return;
    }

    const currentTreeId = treeId || allTrees[0].id;
    setTreeId(currentTreeId);

    const { data } = await getPersons(currentTreeId, { page: 1, pageSize: 20 });
    setPersons(data);
    setHasMore(data.length === 20);
    setPage(1);
    setLoading(false);
  }, [user, treeId]);

  useEffect(() => {
    if (!authLoading) {
      fetchTreeAndPersons();
    }
  }, [authLoading, fetchTreeAndPersons]);

  useEffect(() => {
    if (!treeId || !searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      const { data } = await searchPersons(treeId, searchQuery.trim());
      setPersons(data);
      setHasMore(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, treeId]);

  const loadMore = async () => {
    if (!treeId || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data } = await getPersons(treeId, { page: nextPage, pageSize: 20 });
    setPersons((prev) => [...prev, ...data]);
    setHasMore(data.length === 20);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (treeId) {
      getPersons(treeId, { page: 1, pageSize: 20 }).then(({ data }) => {
        setPersons(data);
        setHasMore(data.length === 20);
        setPage(1);
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Personnes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les membres de votre arbre généalogique
          </p>
        </div>
        {treeId && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter une personne
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une personne..."
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-8 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6E4F] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {persons.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={
                searchQuery
                  ? "Aucun résultat"
                  : "Aucune personne"
              }
              description={
                searchQuery
                  ? "Aucune personne ne correspond à votre recherche."
                  : "Commencez à ajouter des membres à votre arbre généalogique."
              }
              action={
                !searchQuery && treeId ? (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Ajouter une personne
                  </Button>
                ) : searchQuery ? (
                  <Button variant="outline" onClick={clearSearch}>
                    Effacer la recherche
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {persons.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {hasMore && !searchQuery && persons.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} loading={loadingMore}>
            Charger plus
          </Button>
        </div>
      )}

      {treeId && user && (
        <PersonForm
          treeId={treeId}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            fetchTreeAndPersons();
          }}
        />
      )}
    </div>
  );
}
