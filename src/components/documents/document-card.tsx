"use client";

import { useState } from "react";
import {
  Image,
  FileText,
  Music,
  Film,
  File,
  Trash2,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Spinner } from "@/components/ui/spinner";
import type { Document } from "@/types";
import { getDocumentUrl } from "@/services/documents";
import { formatFileSize, formatDate } from "@/lib/utils";

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  PHOTO: "Photo",
  DOCUMENT: "Document",
  AUDIO: "Audio",
  VIDEO: "Vidéo",
  OTHER: "Autre",
};

const DOCUMENT_CATEGORY_VARIANTS: Record<string, "info" | "success" | "warning" | "secondary" | "default"> = {
  PHOTO: "info",
  DOCUMENT: "success",
  AUDIO: "warning",
  VIDEO: "default",
  OTHER: "secondary",
};

interface DocumentCardProps {
  document: Document;
  isOwner: boolean;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document, isOwner, onDelete }: DocumentCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isImage = document.mime_type?.startsWith("image/");
  const isAudio = document.mime_type?.startsWith("audio/");
  const isVideo = document.mime_type?.startsWith("video/");

  const icon = isImage ? (
    <Image className="h-5 w-5 text-purple-600" />
  ) : isAudio ? (
    <Music className="h-5 w-5 text-orange-600" />
  ) : isVideo ? (
    <Film className="h-5 w-5 text-red-600" />
  ) : (
    <FileText className="h-5 w-5 text-blue-600" />
  );

  const iconBg = isImage
    ? "bg-purple-100 dark:bg-purple-900/30"
    : isAudio
      ? "bg-orange-100 dark:bg-orange-900/30"
      : isVideo
        ? "bg-red-100 dark:bg-red-900/30"
        : "bg-blue-100 dark:bg-blue-900/30";

  async function handlePreview() {
    if (!isImage && !isAudio && !isVideo) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    const { data } = await getDocumentUrl(document.storage_path);
    if (data) setPreviewUrl(data);
    setPreviewLoading(false);
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {document.file_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={DOCUMENT_CATEGORY_VARIANTS[document.category] ?? "secondary"}>
                  {DOCUMENT_CATEGORY_LABELS[document.category] ?? document.category}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              {document.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                  {document.description}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {formatDate(document.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(isImage || isAudio || isVideo) && (
                <Button variant="ghost" size="icon-sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {isOwner && (
                <Button variant="ghost" size="icon-sm" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onClose={() => { setPreviewOpen(false); setPreviewUrl(null); }} title={document.file_name}>
        <div className="min-h-[200px] flex items-center justify-center">
          {previewLoading ? (
            <Spinner />
          ) : isImage && previewUrl ? (
            <img src={previewUrl} alt={document.file_name} className="max-w-full max-h-[60vh] rounded-lg" />
          ) : isAudio && previewUrl ? (
            <audio controls src={previewUrl} className="w-full" />
          ) : isVideo && previewUrl ? (
            <video controls src={previewUrl} className="max-w-full max-h-[60vh] rounded-lg" />
          ) : (
            <File className="h-12 w-12 text-gray-400" />
          )}
        </div>
      </Dialog>

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onDelete(document.id)}
        title="Supprimer le document"
        message={`Êtes-vous sûr de vouloir supprimer "${document.file_name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </>
  );
}
