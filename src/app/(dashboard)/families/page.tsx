"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { getFamilies, getFamilyMembers } from "@/services/families";
import { FamilyCard } from "@/components/families/family-card";
import { CreateFamilyDialog } from "@/components/families/create-family-dialog";
import { EmptyState, LoadingPage } from "@/components/ui/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Plus, Users } from "lucide-react";
import type { Family } from "@/types";

interface FamilyWithMemberCount extends Family {
  memberCount: number;
}

export default function FamiliesPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyWithMemberCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchFamilies = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getFamilies(user.id);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    const familiesWithCounts = await Promise.all(
      (data ?? []).map(async (family) => {
        const { data: members } = await getFamilyMembers(family.id);
        return { ...family, memberCount: members?.length ?? 0 };
      })
    );

    setFamilies(familiesWithCounts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchFamilies();
    }
  }, [user, fetchFamilies]);

  if (authLoading || loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes familles
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos familles et arbres généalogiques
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Créer une famille
        </Button>
      </div>

      {error && <ErrorMessage message={error} />}

      {families.length === 0 && !error ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Aucune famille"
              description="Créez votre première famille pour commencer à construire votre arbre généalogique."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Créer une famille
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              memberCount={family.memberCount}
              onClick={() => router.push(`/families/${family.id}`)}
            />
          ))}
        </div>
      )}

      <CreateFamilyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchFamilies}
      />
    </div>
  );
}
