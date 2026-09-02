"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Source } from "@/types";
import { SOURCE_TYPE_LABELS, CERTAINTY_LABELS, CERTAINTY_COLORS } from "@/types/constants";
import { formatDate } from "@/lib/utils";

interface SourceCardProps {
  source: Source;
  isOwner: boolean;
  onEdit: (source: Source) => void;
  onDelete: (id: string) => void;
}

export function SourceCard({ source, isOwner, onEdit, onDelete }: SourceCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-cyan-100 rounded-lg dark:bg-cyan-900/30 shrink-0">
              <BookOpen className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white">{source.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">
                  {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                </Badge>
                <Badge className={CERTAINTY_COLORS[source.reliability] ?? ""}>
                  {CERTAINTY_LABELS[source.reliability] ?? ""}
                </Badge>
              </div>
              {source.author && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Auteur : {source.author}</p>
              )}
              {source.institution && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Institution : {source.institution}</p>
              )}
              {source.date && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Date : {source.date}</p>
              )}
              {source.reference_number && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Référence : {source.reference_number}</p>
              )}
              {source.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{source.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Lien
                  </a>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(source.created_at)}
                </span>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(source)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onDelete(source.id)}
        title="Supprimer la source"
        message={`Êtes-vous sûr de vouloir supprimer "${source.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </>
  );
}
