"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/error-message";
import { createUnion, updateUnion } from "@/services/unions";
import { useAuth } from "@/hooks/use-auth";
import type { Person, Union, UnionType, UnionStatus } from "@/types";

interface UnionFormProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  personAId?: string;
  union?: Union;
  persons: Person[];
  onSaved: () => void;
}

const UNION_TYPE_OPTIONS: { value: UnionType; label: string }[] = [
  { value: "MARRIAGE", label: "Mariage" },
  { value: "TRADITIONAL_MARRIAGE", label: "Mariage traditionnel" },
  { value: "CIVIL_MARRIAGE", label: "Mariage civil" },
  { value: "RELIGIOUS_MARRIAGE", label: "Mariage religieux" },
  { value: "FREE_UNION", label: "Union libre" },
  { value: "CONCUBINAGE", label: "Concubinage" },
  { value: "OTHER", label: "Autre" },
];

const UNION_STATUS_OPTIONS: { value: UnionStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "SEPARATED", label: "Séparé(e)s" },
  { value: "DIVORCED", label: "Divorcé(e)s" },
  { value: "WIDOWED", label: "Veuf/Veuve" },
  { value: "DISSOLVED", label: "Dissoute" },
];

function personLabel(person: Person): string {
  return [person.first_name, person.last_name].filter(Boolean).join(" ") || "Sans nom";
}

export function UnionForm({
  open,
  onClose,
  familyId,
  personAId,
  union,
  persons,
  onSaved,
}: UnionFormProps) {
  const { user } = useAuth();

  const [selectedPersonAId, setSelectedPersonAId] = useState("");
  const [selectedPersonBId, setSelectedPersonBId] = useState("");
  const [searchB, setSearchB] = useState("");
  const [unionType, setUnionType] = useState<UnionType>("MARRIAGE");
  const [status, setStatus] = useState<UnionStatus>("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedPersonAId(union?.person_a_id ?? personAId ?? "");
      setSelectedPersonBId(union?.person_b_id ?? "");
      setSearchB("");
      setUnionType(union?.union_type ?? "MARRIAGE");
      setStatus(union?.status ?? "ACTIVE");
      setStartDate(union?.start_date ?? "");
      setEndDate(union?.end_date ?? "");
      setPlace(union?.place ?? "");
      setNotes(union?.notes ?? "");
      setError(null);
    }
  }, [open, union, personAId]);

  const personAOptions = useMemo(
    () => persons.filter((p) => p.id !== selectedPersonBId),
    [persons, selectedPersonBId]
  );

  const personBOptions = useMemo(() => {
    const query = searchB.trim().toLowerCase();
    return persons
      .filter((p) => p.id !== selectedPersonAId)
      .filter(
        (p) =>
          !query ||
          personLabel(p).toLowerCase().includes(query)
      );
  }, [persons, selectedPersonAId, searchB]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!user) {
      setError("Vous devez être connecté.");
      return;
    }

    if (!selectedPersonAId || !selectedPersonBId) {
      setError("Veuillez sélectionner les deux personnes.");
      return;
    }

    if (selectedPersonAId === selectedPersonBId) {
      setError("Les deux personnes doivent être différentes.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const data = {
      family_id: familyId,
      person_a_id: selectedPersonAId,
      person_b_id: selectedPersonBId,
      union_type: unionType,
      status,
      start_date: startDate.trim() || null,
      end_date: endDate.trim() || null,
      place: place.trim() || null,
      notes: notes.trim() || null,
      created_by: union?.created_by ?? user.id,
    };

    let result: { error: string | null };
    if (union) {
      result = await updateUnion(union.id, data);
    } else {
      result = await createUnion(data);
    }

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSaved();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={union ? "Modifier l'union" : "Nouvelle union"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => handleSubmit()} loading={submitting}>
            {union ? "Enregistrer" : "Créer l'union"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />

        <Select
          label="Première personne"
          value={selectedPersonAId}
          onChange={(e) => setSelectedPersonAId(e.target.value)}
          options={personAOptions.map((p) => ({
            value: p.id,
            label: personLabel(p),
          }))}
          placeholder="Sélectionner la première personne"
        />

        <Input
          label="Rechercher la deuxième personne"
          value={searchB}
          onChange={(e) => setSearchB(e.target.value)}
          placeholder="Nom ou prénom..."
        />

        <Select
          label="Deuxième personne"
          value={selectedPersonBId}
          onChange={(e) => setSelectedPersonBId(e.target.value)}
          options={personBOptions.map((p) => ({
            value: p.id,
            label: personLabel(p),
          }))}
          placeholder="Sélectionner la deuxième personne"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Type d'union"
            value={unionType}
            onChange={(e) => setUnionType(e.target.value as UnionType)}
            options={UNION_TYPE_OPTIONS}
          />
          <Select
            label="Statut"
            value={status}
            onChange={(e) => setStatus(e.target.value as UnionStatus)}
            options={UNION_STATUS_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Date de début"
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="1950 ou vers 1950"
          />
          <Input
            label="Date de fin"
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        <Input
          label="Lieu"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Lieu de l'union..."
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations supplémentaires..."
          rows={3}
        />
      </form>
    </Dialog>
  );
}
