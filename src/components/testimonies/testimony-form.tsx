"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { createTestimony, updateTestimony, uploadAudio } from "@/services/testimonies";
import { useAuth } from "@/hooks/use-auth";
import { formatFileSize } from "@/lib/utils";
import type { Testimony } from "@/types";

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "ln", label: "Lingala" },
  { value: "sw", label: "Swahili" },
  { value: "ki", label: "Kikongo" },
  { value: "ts", label: "Tshiluba" },
  { value: "en", label: "Anglais" },
];

const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "audio/aac"];
const MAX_AUDIO_SIZE = 100 * 1024 * 1024;

interface TestimonyFormProps {
  testimony?: Testimony;
  treeId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TestimonyForm({ testimony, treeId, open, onClose, onSaved }: TestimonyFormProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!testimony;

  const [title, setTitle] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessRelation, setWitnessRelation] = useState("");
  const [language, setLanguage] = useState("fr");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [transcription, setTranscription] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (testimony) {
      setTitle(testimony.title ?? "");
      setWitnessName(testimony.witness_name ?? "");
      setWitnessRelation(testimony.witness_relation ?? "");
      setLanguage(testimony.language ?? "fr");
      setDate(testimony.testimony_date ?? "");
      setDescription(testimony.description ?? "");
      setTranscription(testimony.transcription ?? "");
    } else {
      setTitle("");
      setWitnessName("");
      setWitnessRelation("");
      setLanguage("fr");
      setDate("");
      setDescription("");
      setTranscription("");
    }
    setAudioFile(null);
    setError(null);
  }, [testimony, open]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|webm|aac)$/i)) {
      setError("Format audio non supporté. Utilisez MP3, WAV, OGG, M4A, WebM ou AAC.");
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      setError("Le fichier audio dépasse la taille maximale de 100 Mo.");
      return;
    }
    setError(null);
    setAudioFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!user) return;

    setSaving(true);
    setError(null);

    const payload = {
      family_id: testimony?.family_id ?? "",
      person_id: testimony?.person_id ?? null,
      title: title.trim(),
      witness_person_id: null,
      witness_name: witnessName || null,
      witness_relation: witnessRelation || null,
      language: language || null,
      testimony_date: date || null,
      description: description || null,
      transcription: transcription || null,
      audio_path: testimony?.audio_path ?? null,
      certainty: testimony?.certainty ?? "UNKNOWN",
      created_by: testimony?.created_by ?? user.id,
    };

    let result;
    if (isEditing) {
      result = await updateTestimony(testimony.id, payload);
    } else {
      result = await createTestimony(payload);
    }

    if (result.error) {
      setSaving(false);
      setError(result.error);
      return;
    }

    if (audioFile && result.data) {
      const { error: audioErr } = await uploadAudio(audioFile, treeId, result.data.id);
      if (audioErr) {
        setSaving(false);
        setError("Témoignage enregistré, mais échec de l'upload audio : " + audioErr);
        onSaved();
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Modifier le témoignage" : "Enregistrer un témoignage"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="testimony-form" loading={saving}>
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
        </>
      }
    >
      <form id="testimony-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre du témoignage"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom du témoin"
            value={witnessName}
            onChange={(e) => setWitnessName(e.target.value)}
            placeholder="Nom complet"
          />
          <Input
            label="Lien avec la famille"
            value={witnessRelation}
            onChange={(e) => setWitnessRelation(e.target.value)}
            placeholder="Ex : Grand-mère, Oncle..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Langue"
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <Input
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Ex : 12/03/1950"
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contexte du témoignage..."
        />

        <Textarea
          label="Transcription"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder="Transcription du témoignage..."
          className="min-h-[120px]"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fichier audio (optionnel)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac"
            className="hidden"
            onChange={handleFileSelect}
          />
          {audioFile ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm truncate flex-1">{audioFile.name}</span>
              <span className="text-xs text-gray-500">{formatFileSize(audioFile.size)}</span>
              <button
                type="button"
                onClick={() => setAudioFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Choisir un fichier audio
            </Button>
          )}
          {isEditing && testimony?.audio_path && !audioFile && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Un fichier audio est déjà attaché. Sélectionnez un nouveau fichier pour le remplacer.
            </p>
          )}
        </div>

        <ErrorMessage message={error} />
      </form>
    </Dialog>
  );
}
