"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/spinner";
import { uploadDocument } from "@/services/documents";
import { useAuth } from "@/hooks/use-auth";
import { formatFileSize } from "@/lib/utils";
import type { DocumentCategory } from "@/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const CATEGORY_OPTIONS = [
  { value: "photo", label: "Photo" },
  { value: "document", label: "Document" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Vidéo" },
  { value: "other", label: "Autre" },
];

function guessCategory(mimeType: string): DocumentCategory {
  if (mimeType.startsWith("image/")) return "photo";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

interface FileUploadProps {
  familyId: string;
  onUploaded: () => void;
}

export function FileUpload({ familyId, onUploaded }: FileUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("document");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError("Le fichier dépasse la taille maximale de 50 Mo.");
      return;
    }
    setError(null);
    setSelectedFile(file);
    setCategory(guessCategory(file.type));
    setShowConfirm(true);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleUpload() {
    if (!selectedFile || !user) return;
    setUploading(true);
    setError(null);
    const { error: uploadError } = await uploadDocument(selectedFile, familyId, user.id, {
      category,
      description: description || undefined,
    });
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    setSelectedFile(null);
    setCategory("document");
    setDescription("");
    setShowConfirm(false);
    onUploaded();
  }

  function handleCancel() {
    setSelectedFile(null);
    setShowConfirm(false);
    setDescription("");
    setError(null);
  }

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[#0B6E4F] bg-[#0B6E4F]/5"
            : "border-gray-300 dark:border-gray-600 hover:border-[#0B6E4F] hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
      >
        <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Glissez un fichier ici ou cliquez pour parcourir
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Taille maximale : 50 Mo
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.rtf"
      />

      <Dialog open={showConfirm} onClose={handleCancel} title="Confirmer l'ajout">
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileIcon className="h-8 w-8 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            <Select
              label="Catégorie"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            />

            <Input
              label="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le document..."
            />

            <ErrorMessage message={error} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleUpload} loading={uploading}>
                <Upload className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
