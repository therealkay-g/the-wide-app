"use client";

import { useState, useMemo } from "react";
import { Baby, Plus, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { createPerson } from "@/services/persons";
import { useAuth } from "@/hooks/use-auth";
import type { Gender, Person, UnionWithPersons } from "@/types";

interface UnionChildrenManagerProps {
  union: UnionWithPersons;
  allPersons: Person[];
  unionChildren: { union_id: string; person_id: string }[];
  onAdd: (personId: string) => void;
  onRemove: (personId: string) => void;
}

const GENDER_OPTIONS = [
  { value: "unknown", label: "Inconnu" },
  { value: "male", label: "Garçon" },
  { value: "female", label: "Fille" },
];

function personLabel(person: Person): string {
  return [person.first_name, person.last_name].filter(Boolean).join(" ") || "Sans nom";
}

function birthYear(person: Person): string | null {
  return person.birth_date ? person.birth_date.slice(0, 4) : null;
}

export function UnionChildrenManager({
  union,
  allPersons,
  unionChildren,
  onAdd,
  onRemove,
}: UnionChildrenManagerProps) {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("unknown");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childIds = useMemo(
    () => new Set(unionChildren.map((c) => c.person_id)),
    [unionChildren]
  );

  const children = useMemo(
    () => allPersons.filter((p) => childIds.has(p.id)),
    [allPersons, childIds]
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPersons
      .filter((p) => !childIds.has(p.id))
      .filter((p) => p.id !== union.person_a_id && p.id !== union.person_b_id)
      .filter((p) => !q || personLabel(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [allPersons, childIds, query, union.person_a_id, union.person_b_id]);

  const handleCreateChild = async () => {
    setError(null);

    if (!user) {
      setError("Vous devez être connecté.");
      return;
    }

    if (!newFirstName.trim() && !newLastName.trim()) {
      setError("Le prénom ou le nom de famille est requis.");
      return;
    }

    setCreating(true);

    const treeId = union.person_a?.tree_id ?? union.person_b?.tree_id ?? "";

    const { data: newPerson, error: createErr } = await createPerson({
      tree_id: treeId,
      family_id: union.family_id,
      created_by: user.id,
      first_name: newFirstName.trim() || null,
      middle_name: null,
      last_name: newLastName.trim() || null,
      post_name: null,
      nickname: null,
      traditional_name: null,
      gender: newGender,
      profile_photo: null,
      birth_date: null,
      birth_date_precision: "UNKNOWN",
      birth_place_id: null,
      death_date: null,
      death_date_precision: "UNKNOWN",
      death_place_id: null,
      burial_place_id: null,
      country: null,
      province: null,
      city: null,
      territory: null,
      sector: null,
      chiefdom: null,
      groupement: null,
      village: null,
      clan: null,
      lineage: null,
      family_origin: null,
      certainty: "UNKNOWN",
      notes: null,
      generation: 0,
      profession: null,
      nationality: null,
      biography: null,
      phone: null,
      email: null,
      marital_status: "UNKNOWN",
      is_alive: true,
      adoption_type: "BIOLOGICAL",
    });

    if (createErr || !newPerson) {
      setError(createErr || "Erreur lors de la création de l'enfant.");
      setCreating(false);
      return;
    }

    onAdd(newPerson.id);
    setCreating(false);
    setNewFirstName("");
    setNewLastName("");
    setNewGender("unknown");
  };

  return (
    <div className="space-y-5">
      <ErrorMessage message={error} />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase">
          Enfants de l&apos;union ({children.length})
        </h4>
        {children.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Aucun enfant rattaché à cette union.
          </p>
        ) : (
          <ul className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {children.map((child) => {
              const year = birthYear(child);
              return (
                <li
                  key={child.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Avatar
                    src={child.profile_photo}
                    firstName={child.first_name}
                    lastName={child.last_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {personLabel(child)}
                    </p>
                    {year && (
                      <p className="text-xs text-gray-500">Né(e) en {year}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(child.id)}
                    aria-label="Retirer cet enfant"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <Input
          label="Rechercher une personne à ajouter"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou prénom..."
        />
        {candidates.length > 0 ? (
          <ul className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {candidates.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Avatar
                  src={person.profile_photo}
                  firstName={person.first_name}
                  lastName={person.last_name}
                  size="sm"
                />
                <span className="flex-1 min-w-0 text-sm truncate">
                  {personLabel(person)}
                  {birthYear(person) && (
                    <span className="text-gray-400 ml-1">
                      ({birthYear(person)})
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onAdd(person.id)}
                  aria-label="Ajouter comme enfant"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          query.trim().length > 0 && (
            <p className="text-xs text-gray-400 italic">Aucun résultat.</p>
          )
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Baby className="h-3.5 w-3.5" />
          Ou créer un nouvel enfant :
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Prénom"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            placeholder="Prénom"
          />
          <Input
            label="Nom de famille"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            placeholder="Nom"
          />
        </div>
        <Select
          label="Genre"
          value={newGender}
          onChange={(e) => setNewGender(e.target.value as Gender)}
          options={GENDER_OPTIONS}
        />
        <Button size="sm" onClick={handleCreateChild} loading={creating}>
          <Plus className="h-4 w-4" />
          Créer et ajouter à l&apos;union
        </Button>
      </div>
    </div>
  );
}
