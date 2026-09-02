"use client";

import type { Person, Relationship } from "@/types";

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  onPersonClick?: (personId: string) => void;
  onAddPerson?: () => void;
}

export function FamilyTree(_props: FamilyTreeProps) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <p className="text-sm">Arbre en cours de chargement...</p>
    </div>
  );
}
