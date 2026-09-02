"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ui/error-message";
import { createStory } from "@/services/stories";
import { useAuth } from "@/hooks/use-auth";
import type { Visibility } from "@/types";

interface StoryFormProps {
  treeId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function StoryForm({ treeId, familyId, open, onClose, onCreated }: StoryFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setIntroduction("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Le titre est requis");
      return;
    }
    if (!user) {
      setError("Vous devez être connecté");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createStory({
      family_id: familyId ?? "",
      title: title.trim(),
      content: introduction.trim() || null,
      author_id: user.id,
      visibility: "family" as Visibility,
      cover_photo: null,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    reset();
    onCreated();
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Raconter une histoire"
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
          label="Titre de l'histoire"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="L'histoire de ma famille..."
        />

        <Textarea
          label="Introduction"
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="Décrivez brièvement cette histoire..."
          className="min-h-[100px]"
        />
      </div>
    </Dialog>
  );
}
