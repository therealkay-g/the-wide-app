"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Pencil, Trash2, BookOpen, Calendar } from "lucide-react";
import { truncate, formatDate } from "@/lib/utils";
import type { Story } from "@/types";

interface StoryCardProps {
  story: Story;
  sectionCount: number;
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
}

export function StoryCard({ story, sectionCount, onEdit, onDelete }: StoryCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(story)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
              {story.title}
            </h3>
            {story.visibility === "public" ? (
              <Badge variant="success">Publié</Badge>
            ) : story.visibility === "family" ? (
              <Badge variant="info">Famille</Badge>
            ) : (
              <Badge variant="secondary">Brouillon</Badge>
            )}
          </div>

          {story.content && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
              {truncate(story.content, 150)}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {sectionCount} section{sectionCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(story.created_at)}
              </span>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(story)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => onDelete(story.id)}
        title="Supprimer l'histoire"
        message={`Êtes-vous sûr de vouloir supprimer "${story.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </>
  );
}
