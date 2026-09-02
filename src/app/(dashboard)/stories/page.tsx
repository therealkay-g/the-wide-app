"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getStories, deleteStory } from "@/services/stories";
import { getTrees } from "@/services/trees";
import { getFamilies } from "@/services/families";
import { StoryCard } from "@/components/stories/story-card";
import { StoryForm } from "@/components/stories/story-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { BookMarked, Plus } from "lucide-react";
import type { Story } from "@/types";

export default function StoriesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: families } = await getFamilies(user.id);
      if (!families.length) {
        setLoading(false);
        return;
      }

      const familyIds = families.map((f) => f.id);
      let allTrees: { id: string; family_id: string }[] = [];
      for (const fid of familyIds) {
        const { data: trees } = await getTrees(fid);
        allTrees = allTrees.concat(trees);
      }

      if (!allTrees.length) {
        setLoading(false);
        return;
      }

      const tid = allTrees[0].id;
      setTreeId(tid);

      const result = await getStories(allTrees[0].family_id);
      if (result.error) setError(result.error);
      setStories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    const result = await deleteStory(id);
    if (result.error) {
      setError(result.error);
    } else {
      setStories((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleEdit = (story: Story) => {
    router.push(`/stories/${story.id}`);
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
            Histoires familiales
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {stories.length} histoire{stories.length !== 1 ? "s" : ""}
          </p>
        </div>
        {treeId && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Raconter une histoire
          </Button>
        )}
      </div>

      <ErrorMessage message={error} />

      {stories.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<BookMarked className="h-12 w-12" />}
              title="Aucune histoire"
              description="Racontez l'histoire de votre famille pour la transmettre aux générations futures."
              action={
                treeId && (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Raconter une histoire
                  </Button>
                )
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              sectionCount={0}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {treeId && (
        <StoryForm
          treeId={treeId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
