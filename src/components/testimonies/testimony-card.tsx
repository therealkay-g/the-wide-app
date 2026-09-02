"use client";

import { useState } from "react";
import { Mic, Pencil, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Spinner } from "@/components/ui/spinner";
import { getDocumentUrl } from "@/services/documents";
import type { Testimony } from "@/types";
import { formatDate, truncate } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  ln: "Lingala",
  sw: "Swahili",
  ki: "Kikongo",
  ts: "Tshiluba",
  en: "Anglais",
};

interface TestimonyCardProps {
  testimony: Testimony;
  isOwner: boolean;
  onEdit: (testimony: Testimony) => void;
  onDelete: (id: string) => void;
}

export function TestimonyCard({ testimony, isOwner, onEdit, onDelete }: TestimonyCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const hasTranscription = !!testimony.transcription;
  const transcriptionPreview = testimony.transcription
    ? truncate(testimony.transcription, 200)
    : "";
  const needsExpand =
    testimony.transcription && testimony.transcription.length > 200;

  async function handleLoadAudio() {
    if (audioLoaded || !testimony.audio_path) return;
    setAudioLoading(true);
    const { data } = await getDocumentUrl(testimony.audio_path);
    if (data) setAudioUrl(data);
    setAudioLoaded(true);
    setAudioLoading(false);
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30 shrink-0">
              <Mic className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {testimony.title || "Témoignage sans titre"}
              </h3>
              {testimony.witness_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Témoin : {testimony.witness_name}
                  {testimony.witness_relation && (
                    <span className="text-gray-400"> ({testimony.witness_relation})</span>
                  )}
                </p>
              )}
              {testimony.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {testimony.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {testimony.language && (
                  <Badge variant="info">
                    {LANGUAGE_LABELS[testimony.language] ?? testimony.language}
                  </Badge>
                )}
                {testimony.testimony_date && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {testimony.testimony_date}
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(testimony.created_at)}
                </span>
              </div>

              {testimony.audio_path && (
                <div className="mt-3">
                  {!audioLoaded && !audioLoading && (
                    <Button variant="outline" size="sm" onClick={handleLoadAudio}>
                      <Mic className="h-3 w-3" /> Écouter l&apos;audio
                    </Button>
                  )}
                  {audioLoading && <Spinner size={20} />}
                  {audioUrl && (
                    <audio controls src={audioUrl} className="w-full mt-2" />
                  )}
                </div>
              )}

              {hasTranscription && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {expanded ? testimony.transcription : transcriptionPreview}
                  </p>
                  {needsExpand && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-xs text-[#0B6E4F] hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      {expanded ? (
                        <>Réduire <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Voir plus <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(testimony)}>
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
        onConfirm={() => onDelete(testimony.id)}
        title="Supprimer le témoignage"
        message={`Êtes-vous sûr de vouloir supprimer "${testimony.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </>
  );
}
