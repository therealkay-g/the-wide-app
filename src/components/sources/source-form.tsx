"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { createSource, updateSource } from "@/services/sources";
import { useAuth } from "@/hooks/use-auth";
import { SOURCE_TYPE_LABELS, CERTAINTY_LABELS } from "@/types/constants";
import type { Source, SourceType, CertaintyLevel } from "@/types";

const SOURCE_TYPE_OPTIONS = Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const CERTAINTY_OPTIONS = Object.entries(CERTAINTY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface SourceFormProps {
  source?: Source;
  treeId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SourceForm({ source, treeId, familyId, open, onClose, onSaved }: SourceFormProps) {
  const { user } = useAuth();
  const isEditing = !!source;

  const [title, setTitle] = useState("");
  const [type, setType] = useState<SourceType>("OTHER");
  const [author, setAuthor] = useState("");
  const [institution, setInstitution] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [reliability, setReliability] = useState<CertaintyLevel>("UNKNOWN");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (source) {
      setTitle(source.title);
      setType(source.type);
      setAuthor(source.author ?? "");
      setInstitution(source.institution ?? "");
      setDate(source.date ?? "");
      setReference(source.reference_number ?? "");
      setUrl(source.url ?? "");
      setDescription(source.description ?? "");
      setReliability(source.reliability);
    } else {
      setTitle("");
      setType("OTHER");
      setAuthor("");
      setInstitution("");
      setDate("");
      setReference("");
      setUrl("");
      setDescription("");
      setReliability("UNKNOWN");
    }
    setError(null);
  }, [source, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!user) return;

    setSaving(true);
    setError(null);

    const payload = {
      family_id: source?.family_id ?? familyId ?? "",
      created_by: source?.created_by ?? user.id,
      updated_at: new Date().toISOString(),
      title: title.trim(),
      type,
      author: author || null,
      institution: institution || null,
      date: date || null,
      reference_number: reference || null,
      url: url || null,
      description: description || null,
      reliability,
    };

    const result = isEditing
      ? await updateSource(source.id, payload)
      : await createSource(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Modifier la source" : "Ajouter une source"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="source-form" loading={saving}>
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <form id="source-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la source"
          required
        />

        <Select
          label="Type"
          options={SOURCE_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as SourceType)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Auteur"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nom de l'auteur"
          />
          <Input
            label="Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Institution"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Ex : 1950, 12/03/1950"
          />
          <Input
            label="Référence"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Numéro de référence"
          />
        </div>

        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de la source..."
        />

        <Select
          label="Fiabilité"
          options={CERTAINTY_OPTIONS}
          value={reliability}
          onChange={(e) => setReliability(e.target.value as CertaintyLevel)}
        />

        <ErrorMessage message={error} />
      </form>
    </Dialog>
  );
}
