"use client";

import { useState, useEffect } from "react";
import { createPlace, updatePlace } from "@/services/places";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Place } from "@/types";

interface PlaceFormProps {
  place?: Place;
  ownerId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function PlaceForm({ place, ownerId, familyId, open, onClose, onSaved }: PlaceFormProps) {
  const [form, setForm] = useState({
    name: "",
    country: "",
    province: "",
    city: "",
    territory: "",
    sector: "",
    chiefdom: "",
    groupement: "",
    village: "",
    former_name: "",
    alternative_name: "",
    latitude: "",
    longitude: "",
    description: "",
    historical_period: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (place) {
      setForm({
        name: place.name || "",
        country: place.country || "",
        province: place.province || "",
        city: place.city || "",
        territory: place.territory || "",
        sector: place.sector || "",
        chiefdom: place.chiefdom || "",
        groupement: place.groupement || "",
        village: place.village || "",
        former_name: place.former_name || "",
        alternative_name: place.alternative_name || "",
        latitude: place.latitude?.toString() || "",
        longitude: place.longitude?.toString() || "",
        description: place.description || "",
        historical_period: place.historical_period || "",
      });
    } else {
      setForm({
        name: "",
        country: "",
        province: "",
        city: "",
        territory: "",
        sector: "",
        chiefdom: "",
        groupement: "",
        village: "",
        former_name: "",
        alternative_name: "",
        latitude: "",
        longitude: "",
        description: "",
        historical_period: "",
      });
    }
    setError(null);
  }, [place, open]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Le nom du lieu est requis");
      return;
    }

    setSaving(true);
    setError(null);

    const data = {
      family_id: place?.family_id ?? familyId ?? "",
      created_by: place?.created_by ?? ownerId,
      updated_at: new Date().toISOString(),
      name: form.name.trim(),
      country: form.country || null,
      province: form.province || null,
      city: form.city || null,
      territory: form.territory || null,
      sector: form.sector || null,
      chiefdom: form.chiefdom || null,
      groupement: form.groupement || null,
      village: form.village || null,
      former_name: form.former_name || null,
      alternative_name: form.alternative_name || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      description: form.description || null,
      historical_period: form.historical_period || null,
    };

    const result = place
      ? await updatePlace(place.id, data)
      : await createPlace(data);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onSaved();
    onClose();
    setSaving(false);
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <Input
      label={label}
      type={type}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
    />
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={place ? "Modifier le lieu" : "Ajouter un lieu"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4 min-w-[360px] max-h-[70vh] overflow-y-auto">
        <ErrorMessage message={error} />
        {field("name", "Nom *")}
        {field("country", "Pays")}
        {field("province", "Province")}
        {field("city", "Ville")}
        {field("territory", "Territoire")}
        {field("sector", "Secteur")}
        {field("chiefdom", "Chefferie")}
        {field("groupement", "Groupement")}
        {field("village", "Village")}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Noms alternatifs</p>
          {field("former_name", "Ancien nom")}
          {field("alternative_name", "Nom alternatif")}
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Coordonnées</p>
          <div className="grid grid-cols-2 gap-3">
            {field("latitude", "Latitude")}
            {field("longitude", "Longitude")}
          </div>
        </div>

        {field("historical_period", "Période historique")}
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description ou notes sur ce lieu"
        />
      </div>
    </Dialog>
  );
}
