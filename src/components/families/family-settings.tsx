"use client";

import { useState } from "react";
import { updateFamily, deleteFamily } from "@/services/families";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Family, Visibility } from "@/types";

interface FamilySettingsProps {
  family: Family;
  onSaved: () => void;
}

export function FamilySettings({ family, onSaved }: FamilySettingsProps) {
  const [name, setName] = useState(family.name);
  const [description, setDescription] = useState(family.description ?? "");
  const [privacy, setPrivacy] = useState<Visibility>(family.privacy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: err } = await updateFamily(family.id, {
      name,
      description: description || null,
      privacy,
    });

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved();
      }, 1500);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirmText !== "SUPPRIMER") return;
    setDeleting(true);
    const { error: err } = await deleteFamily(family.id);
    if (!err) {
      onSaved();
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-4">
        <ErrorMessage message={error} />

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Modifications enregistrées avec succès.
          </div>
        )}

        <Input
          label="Nom de la famille"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez cette famille..."
        />

        <Select
          label="Visibilité"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as Visibility)}
          options={[
            { value: "private", label: "Privé — Visible uniquement par vous" },
            { value: "family", label: "Famille — Visible par les membres" },
            { value: "public", label: "Public — Visible par tous" },
          ]}
        />

        <Button type="submit" loading={saving}>
          Enregistrer les modifications
        </Button>
      </form>

      <div className="border-t border-red-200 pt-6">
        <h3 className="text-sm font-semibold text-red-600 mb-1">Zone dangereuse</h3>
        <p className="text-sm text-gray-500 mb-3">
          Supprimer cette famille entraînera la perte de toutes les données associées. Cette action est irréversible.
        </p>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Supprimer la famille
        </Button>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
        }}
        title="Supprimer la famille"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmText("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={deleting}
              disabled={confirmText !== "SUPPRIMER"}
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Êtes-vous sûr de vouloir supprimer « {family.name} » ? Cette action est irréversible.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Tapez <strong>SUPPRIMER</strong> pour confirmer.
        </p>
        <Input
          className="mt-3"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="SUPPRIMER"
        />
      </Dialog>
    </div>
  );
}
