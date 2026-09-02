"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { useUser } from "@/hooks/use-user";
import { createFamily } from "@/services/families";
import type { Visibility } from "@/types";

interface CreateFamilyDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateFamilyDialog({ open, onClose, onCreated }: CreateFamilyDialogProps) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Visibility>("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    const { data, error: createError } = await createFamily({
      name,
      description: description || null,
      privacy,
      owner_id: user.id,
    });

    if (createError) {
      setError(createError);
      setLoading(false);
      return;
    }

    if (data) {
      setName("");
      setDescription("");
      setPrivacy("private");
      onCreated();
      onClose();
    }
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      setName("");
      setDescription("");
      setPrivacy("private");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Créer une famille"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" form="create-family-form" loading={loading}>
            Créer
          </Button>
        </>
      }
    >
      <form id="create-family-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />

        <Input
          label="Nom de la famille"
          placeholder="Famille Kabila"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

        <Textarea
          label="Description (optionnel)"
          placeholder="Description de la famille, histoire, origines..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <Select
          label="Confidentialité"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value as Visibility)}
          options={[
            { value: "private", label: "Privé - Visible uniquement par vous" },
            { value: "family", label: "Famille - Visible par les membres" },
            { value: "public", label: "Public - Visible par tous" },
          ]}
          disabled={loading}
        />
      </form>
    </Dialog>
  );
}
