"use client";

import { useState, useEffect, useCallback } from "react";
import { create, update } from "@/services/researches";
import { getPersons } from "@/services/persons";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/error-message";
import { useAuth } from "@/hooks/use-auth";
import type { Research, ResearchStatus, Person } from "@/types";
import { RESEARCH_STATUS_LABELS } from "@/types/constants";

interface ResearchFormProps {
  research?: Research;
  treeId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ResearchForm({ research, treeId, familyId, open, onClose, onSaved }: ResearchFormProps) {
  const { user } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [form, setForm] = useState({
    question: "",
    person_id: "",
    period_start: "",
    period_end: "",
    hypothesis: "",
    sources_consulted: "",
    results: "",
    status: "TODO" as ResearchStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    const res = await getPersons(treeId);
    setPersons(res.data);
  }, [treeId]);

  useEffect(() => {
    if (open) fetchPersons();
  }, [open, fetchPersons]);

  useEffect(() => {
    if (research) {
      setForm({
        question: research.question || "",
        person_id: research.person_id || "",
        period_start: research.period_start || "",
        period_end: research.period_end || "",
        hypothesis: research.hypothesis || "",
        sources_consulted: research.sources_consulted || "",
        results: research.results || "",
        status: research.status || "TODO",
      });
    } else {
      setForm({
        question: "",
        person_id: "",
        period_start: "",
        period_end: "",
        hypothesis: "",
        sources_consulted: "",
        results: "",
        status: "TODO",
      });
    }
    setError(null);
  }, [research, open]);

  const handleSave = async () => {
    if (!form.question.trim()) {
      setError("La question est requise");
      return;
    }
    if (!user) {
      setError("Vous devez être connecté");
      return;
    }

    setSaving(true);
    setError(null);

    const data = {
      family_id: research?.family_id ?? familyId ?? "",
      created_by: research?.created_by ?? user.id,
      question: form.question.trim(),
      person_id: form.person_id || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      place: null,
      hypothesis: form.hypothesis || null,
      sources_consulted: form.sources_consulted || null,
      results: form.results || null,
      status: form.status,
    };

    const result = research
      ? await update(research.id, data)
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
      title={research ? "Modifier la recherche" : "Nouvelle recherche"}
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
      <div className="space-y-4 min-w-[380px] max-h-[70vh] overflow-y-auto">
        <ErrorMessage message={error} />

        <Textarea
          label="Question de recherche"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          placeholder="Quelle question souhaitez-vous résoudre ?"
        />

        <Select
          label="Personne concernée"
          value={form.person_id}
          onChange={(e) => setForm({ ...form, person_id: e.target.value })}
          options={[{ value: "", label: "Aucune" }, ...personOptions]}
          placeholder="Sélectionner une personne"
        />

        <Select
          label="Statut"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value as ResearchStatus })
          }
          options={Object.entries(RESEARCH_STATUS_LABELS).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Période début"
            type="date"
            value={form.period_start}
            onChange={(e) => setForm({ ...form, period_start: e.target.value })}
          />
          <Input
            label="Période fin"
            type="date"
            value={form.period_end}
            onChange={(e) => setForm({ ...form, period_end: e.target.value })}
          />
        </div>

        <Textarea
          label="Hypothèse"
          value={form.hypothesis}
          onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
          placeholder="Votre hypothèse de travail"
        />

        <Textarea
          label="Sources consultées"
          value={form.sources_consulted}
          onChange={(e) => setForm({ ...form, sources_consulted: e.target.value })}
          placeholder="Liste des sources déjà consultées"
        />

        <Textarea
          label="Résultats"
          value={form.results}
          onChange={(e) => setForm({ ...form, results: e.target.value })}
          placeholder="Résultats de la recherche"
        />
      </div>
    </Dialog>
  );
}
