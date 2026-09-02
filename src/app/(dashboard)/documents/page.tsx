"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDocuments, deleteDocument } from "@/services/documents";
import { getFamilies } from "@/services/families";
import { DocumentCard } from "@/components/documents/document-card";
import { FileUpload } from "@/components/documents/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, LoadingPage } from "@/components/ui/status";
import { ErrorMessage } from "@/components/ui/error-message";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Document, DocumentCategory } from "@/types";

const CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "PHOTO", label: "Photos" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "AUDIO", label: "Audio" },
  { value: "VIDEO", label: "Vidéos" },
];

const CATEGORY_VARIANTS: Record<string, "default" | "info" | "success" | "warning" | "secondary"> = {
  ALL: "default",
  PHOTO: "info",
  DOCUMENT: "success",
  AUDIO: "warning",
  VIDEO: "secondary",
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: families, error: famErr } = await getFamilies(user.id);
    if (famErr) {
      setError(famErr);
      setLoading(false);
      return;
    }
    if (families.length === 0) {
      setLoading(false);
      return;
    }
    const fId = families[0].id;
    setFamilyId(fId);
    const { data, error: docErr } = await getDocuments(fId);
    if (docErr) setError(docErr);
    else setDocuments(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id: string) {
    setDeleting(true);
    const { error: delErr } = await deleteDocument(id);
    setDeleting(false);
    setDeleteId(null);
    if (delErr) {
      setError(delErr);
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  const filtered = documents.filter((d) => {
    if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.file_name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ErrorMessage message={error} />

      {familyId && <FileUpload familyId={familyId} onUploaded={fetchData} />}

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={categoryFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        <div className="ml-auto w-64">
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Aucun document"
              description="Ajoutez des documents, photos et fichiers pour préserver votre patrimoine familial."
            />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="Aucun résultat"
              description="Aucun document ne correspond à votre recherche."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isOwner={doc.owner_id === user?.id}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Supprimer le document"
        message="Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </div>
  );
}
