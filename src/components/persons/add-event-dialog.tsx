"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { createEvent } from "@/services/events";
import type {
  EventType,
  DatePrecision,
  CertaintyLevel,
} from "@/types";
import {
  EVENT_TYPE_LABELS,
  DATE_PRECISION_LABELS,
  CERTAINTY_LABELS,
} from "@/types/constants";

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  personId: string;
  treeId: string;
  familyId?: string;
  createdBy?: string;
  onCreated?: () => void;
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const DATE_PRECISION_OPTIONS = Object.entries(DATE_PRECISION_LABELS).map(
  ([value, label]) => ({ value, label })
);

const CERTAINTY_OPTIONS = Object.entries(CERTAINTY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export function AddEventDialog({
  open,
  onClose,
  personId,
  treeId,
  familyId,
  createdBy,
  onCreated,
}: AddEventDialogProps) {
  const [type, setType] = useState<EventType>("OTHER");
  const [date, setDate] = useState("");
  const [datePrecision, setDatePrecision] =
    useState<DatePrecision>("UNKNOWN");
  const [description, setDescription] = useState("");
  const [certainty, setCertainty] = useState<CertaintyLevel>("UNKNOWN");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setType("OTHER");
      setDate("");
      setDatePrecision("UNKNOWN");
      setDescription("");
      setCertainty("UNKNOWN");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const { data, error: err } = await createEvent({
      person_id: personId,
      family_id: familyId ?? "",
      event_type: type,
      date_value: date || null,
      date_precision: datePrecision,
      place_id: null,
      description: description.trim() || null,
      source_id: null,
      certainty,
      created_by: createdBy ?? "",
    });

    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }

    if (data) {
      onCreated?.();
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ajouter un événement"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorMessage message={error} />

        <Select
          label="Type d'événement"
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          options={EVENT_TYPE_OPTIONS}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Précision"
            value={datePrecision}
            onChange={(e) =>
              setDatePrecision(e.target.value as DatePrecision)
            }
            options={DATE_PRECISION_OPTIONS}
          />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails de l'événement..."
          rows={3}
        />

        <Select
          label="Niveau de certitude"
          value={certainty}
          onChange={(e) => setCertainty(e.target.value as CertaintyLevel)}
          options={CERTAINTY_OPTIONS}
        />
      </div>
    </Dialog>
  );
}
