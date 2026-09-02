"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { searchPersons, createPerson } from "@/services/persons";
import { createRelationship } from "@/services/relationships";
import { useAuth } from "@/hooks/use-auth";
import type { Person, RelationshipType, CertaintyLevel, Gender } from "@/types";
import { CERTAINTY_LABELS } from "@/types/constants";

interface AddRelationDialogProps {
  open: boolean;
  onClose: () => void;
  personId: string;
  treeId: string;
  familyId?: string;
  relationType: "parent" | "child" | "spouse" | "sibling";
  onCreated?: () => void;
}

const CERTAINTY_OPTIONS = Object.entries(CERTAINTY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const RELATION_LABELS_MAP: Record<string, string> = {
  parent: "Ajouter un parent",
  child: "Ajouter un enfant",
  spouse: "Ajouter un conjoint(e)",
  sibling: "Ajouter un frère/une sœur",
};

export function AddRelationDialog({
  open,
  onClose,
  personId,
  treeId,
  familyId,
  relationType,
  onCreated,
}: AddRelationDialogProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [certainty, setCertainty] = useState<CertaintyLevel>("UNKNOWN");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data } = await searchPersons(treeId, q);
      setResults(data.filter((p) => p.id !== personId).slice(0, 8));
      setLoading(false);
    },
    [treeId, personId]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedPerson(null);
      setFirstName("");
      setLastName("");
      setGender("unknown");
      setCertainty("UNKNOWN");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!user) {
      setError("Vous devez être connecté.");
      setLoading(false);
      return;
    }

    let targetPersonId: string;

    if (selectedPerson) {
      targetPersonId = selectedPerson.id;
    } else {
      if (!firstName.trim() && !lastName.trim()) {
        setError("Recherchez ou créez une personne.");
        setLoading(false);
        return;
      }
      const { data: newPerson, error: createErr } = await createPerson({
        tree_id: treeId,
        family_id: familyId ?? "",
        created_by: user.id,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        middle_name: null,
        post_name: null,
        nickname: null,
        traditional_name: null,
        gender,
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
        profession: null,
        nationality: null,
        biography: null,
        phone: null,
        email: null,
        marital_status: "UNKNOWN",
        is_alive: true,
        adoption_type: "UNKNOWN",
        generation: 0,
      });
      if (createErr || !newPerson) {
        setError(createErr || "Erreur lors de la création");
        setLoading(false);
        return;
      }
      targetPersonId = newPerson.id;
    }

    if (relationType === "parent") {
      const rel1 = await createRelationship({
        person_id: targetPersonId,
        related_person_id: personId,
        relationship_type: "BIOLOGICAL_PARENT" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel1.error) {
        setError(rel1.error);
        setLoading(false);
        return;
      }

      const rel2 = await createRelationship({
        person_id: personId,
        related_person_id: targetPersonId,
        relationship_type: "CHILD" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel2.error) {
        setError(rel2.error);
        setLoading(false);
        return;
      }
    } else if (relationType === "child") {
      const rel1 = await createRelationship({
        person_id: personId,
        related_person_id: targetPersonId,
        relationship_type: "BIOLOGICAL_PARENT" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel1.error) {
        setError(rel1.error);
        setLoading(false);
        return;
      }

      const rel2 = await createRelationship({
        person_id: targetPersonId,
        related_person_id: personId,
        relationship_type: "CHILD" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel2.error) {
        setError(rel2.error);
        setLoading(false);
        return;
      }
    } else if (relationType === "spouse") {
      const rel1 = await createRelationship({
        person_id: personId,
        related_person_id: targetPersonId,
        relationship_type: "SPOUSE" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel1.error) {
        setError(rel1.error);
        setLoading(false);
        return;
      }

      const rel2 = await createRelationship({
        person_id: targetPersonId,
        related_person_id: personId,
        relationship_type: "SPOUSE" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel2.error) {
        setError(rel2.error);
        setLoading(false);
        return;
      }
    } else if (relationType === "sibling") {
      const rel1 = await createRelationship({
        person_id: personId,
        related_person_id: targetPersonId,
        relationship_type: "SIBLING" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel1.error) {
        setError(rel1.error);
        setLoading(false);
        return;
      }

      const rel2 = await createRelationship({
        person_id: targetPersonId,
        related_person_id: personId,
        relationship_type: "SIBLING" as RelationshipType,
        certainty,
        union_id: null,
        notes: null,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      });
      if (rel2.error) {
        setError(rel2.error);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onCreated?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={RELATION_LABELS_MAP[relationType]}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Confirmer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorMessage message={error} />

        <div>
          <Input
            label="Rechercher une personne"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPerson(null);
            }}
            placeholder="Nom ou prénom..."
          />
          {loading && (
            <Spinner className="mt-2" size={16} />
          )}
          {results.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm max-h-48 overflow-y-auto mt-2">
              {results.map((p) => {
                const name = [p.first_name, p.last_name]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPerson(p);
                      setQuery(name);
                      setResults([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    {name || "Sans nom"}
                    {p.birth_date && (
                      <span className="text-gray-400 ml-1">
                        ({new Date(p.birth_date).getFullYear()})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!selectedPerson && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 mb-2">
              Ou créer une nouvelle personne :
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Prénom"
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nom"
              />
            </div>
            <Select
              label="Genre"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { value: "unknown", label: "Inconnu" },
                { value: "male", label: "Homme" },
                { value: "female", label: "Femme" },
                { value: "other", label: "Autre" },
              ]}
            />
          </div>
        )}

        <Select
          label="Niveau de certitude"
          value={certainty}
          onChange={(e) => setCertainty(e.target.value as CertaintyLevel)}
          options={CERTAINTY_OPTIONS}
        />
      </div>
    </Dialog>
  );
}
