"use client";

import { useState, useEffect, useCallback } from "react";
import { create, update } from "@/services/migrations";
import { getPersons } from "@/services/persons";
import { getPlaces } from "@/services/places";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/error-message";
import type { MigrationRecord, Person, Place } from "@/types";

interface MigrationFormProps {
  migration?: MigrationRecord;
  personId?: string;
  treeId: string;
  ownerId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function MigrationForm({
  migration,
  personId: preselectedPersonId,
  treeId,
  ownerId,
  familyId,
  open,
  onClose,
  onSaved,
}: MigrationFormProps) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState({
    person_id: preselectedPersonId || "",
    origin_place: "",
    destination_place: "",
    date_start: "",
    date_end: "",
    reason: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [personsRes, placesRes] = await Promise.all([
      getPersons(treeId),
      getPlaces(ownerId),
    ]);
    setPersons(personsRes.data);
    setPlaces(placesRes.data);
  }, [treeId, ownerId]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  useEffect(() => {
    if (migration) {
      setForm({
        person_id: migration.person_id,
        origin_place: migration.origin_place || "",
        destination_place: migration.destination_place || "",
        date_start: migration.date_start || "",
        date_end: migration.date_end || "",
        reason: migration.reason || "",
        notes: migration.notes || "",
      });
    } else {
      setForm({
        person_id: preselectedPersonId || "",
        origin_place: "",
        destination_place: "",
        date_start: "",
        date_end: "",
        reason: "",
        notes: "",
      });
    }
    setError(null);
  }, [migration, preselectedPersonId, open]);

  const handleSave = async () => {
    if (!form.person_id) {
      setError("Veuillez sélectionner une personne");
      return;
    }
    if (!form.origin_place.trim() || !form.destination_place.trim()) {
      setError("Veuillez renseigner les lieux d'origine et de destination");
      return;
    }

    setSaving(true);
    setError(null);

    const data = {
      person_id: form.person_id,
      family_id: migration?.family_id ?? familyId ?? "",
      origin_place_id: null,
      destination_place_id: null,
      origin_place: form.origin_place.trim(),
      destination_place: form.destination_place.trim(),
      date_start: form.date_start || null,
      date_end: form.date_end || null,
      reason: form.reason || null,
      source_id: null,
      notes: form.notes || null,
      created_by: migration?.created_by ?? ownerId,
      updated_at: new Date().toISOString(),
    };

    const result = migration
      ? await update(migration.id, data)
      : await create(data);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
    setSaving(false);
  };

  const personOptions = persons.map((p) => ({
    value: p.id,
    label: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Sans nom",
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={migration ? "Modifier la migration" : "Ajouter une migration"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4 min-w-[360px]">
        <ErrorMessage message={error} />

        <Select
          label="Personne"
          value={form.person_id}
          onChange={(e) => setForm({ ...form, person_id: e.target.value })}
          options={personOptions}
          placeholder="Sélectionner une personne"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lieu d&apos;origine
          </label>
          <input
            type="text"
            value={form.origin_place}
            onChange={(e) => setForm({ ...form, origin_place: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6E4F] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Ex: Kinshasa, RDC"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lieu de destination
          </label>
          <input
            type="text"
            value={form.destination_place}
            onChange={(e) => setForm({ ...form, destination_place: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6E4F] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Ex: Paris, France"
          />
        </div>

        <Input
          label="Date de début"
          type="date"
          value={form.date_start}
          onChange={(e) => setForm({ ...form, date_start: e.target.value })}
        />

        <Input
          label="Date de fin (optionnel)"
          type="date"
          value={form.date_end}
          onChange={(e) => setForm({ ...form, date_end: e.target.value })}
        />

        <Input
          label="Motif"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Ex: travail, mariage, conflit..."
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes additionnelles"
        />
      </div>
    </Dialog>
  );
}
