"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { createTree } from "@/services/trees";
import type { Family, Tree, Visibility } from "@/types";

interface CreateTreeDialogProps {
  open: boolean;
  onClose: () => void;
  families: Family[];
  defaultFamilyId?: string;
  userId: string;
  onCreated: (tree: Tree) => void;
}

export function CreateTreeDialog({
  open,
  onClose,
  families,
  defaultFamilyId,
  userId,
  onCreated,
}: CreateTreeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [familyId, setFamilyId] = useState(defaultFamilyId || "");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyOptions = families.map((f) => ({ value: f.id, label: f.name }));
  const visibilityOptions = [
    { value: "private", label: "Privé" },
    { value: "family", label: "Famille" },
    { value: "public", label: "Public" },
  ];

  const reset = () => {
    setName("");
    setDescription("");
    setFamilyId(defaultFamilyId || "");
    setVisibility("private");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (!familyId) {
      setError("Veuillez sélectionner une famille");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createTree({
      name: name.trim(),
      description: description.trim() || null,
      family_id: familyId,
      visibility,
      created_by: userId,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      onCreated(result.data);
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Créer un arbre généalogique"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Créer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          label="Nom de l'arbre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Arbre de la famille Mukendi"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description optionnelle..."
        />

        <Select
          label="Famille"
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
          options={familyOptions}
          placeholder="Sélectionner une famille"
        />

        <Select
          label="Visibilité"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as Visibility)}
          options={visibilityOptions}
        />
      </div>
    </Dialog>
  );
}
