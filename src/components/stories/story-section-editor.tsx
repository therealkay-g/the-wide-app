"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Trash2, GripVertical } from "lucide-react";
import type { StorySection } from "@/types";

interface StorySectionEditorProps {
  section: StorySection;
  onUpdate: (id: string, data: { title: string; content: string }) => void;
  onDelete: (id: string) => void;
}

export function StorySectionEditor({ section, onUpdate, onDelete }: StorySectionEditorProps) {
  const [title, setTitle] = useState(section.title || "");
  const [content, setContent] = useState(section.content || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    onUpdate(section.id, { title: value, content });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    onUpdate(section.id, { title, content: value });
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Section {section.order_index + 1}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Titre de la section..."
        />

        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Rédigez le contenu de cette section..."
          className="min-h-[200px]"
        />
      </div>

      <ConfirmationDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => onDelete(section.id)}
        title="Supprimer la section"
        message="Êtes-vous sûr de vouloir supprimer cette section ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </>
  );
}
