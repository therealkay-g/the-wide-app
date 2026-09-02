"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Profile } from "@/types";
import { Camera } from "lucide-react";

interface ProfileSettingsProps {
  profile: Profile;
  onSaved: () => void;
}

const africanCountries = [
  { value: "RDC", label: "République Démocratique du Congo" },
  { value: "COG", label: "République du Congo" },
  { value: "BRA", label: "Burundi" },
  { value: "RWA", label: "Rwanda" },
  { value: "UGA", label: "Ouganda" },
  { value: "TZA", label: "Tanzanie" },
  { value: "ZMB", label: "Zambie" },
  { value: "AGO", label: "Angola" },
  { value: "CAF", label: "Centrafrique" },
  { value: "CMR", label: "Cameroun" },
  { value: "KEN", label: "Kenya" },
  { value: "ETH", label: "Éthiopie" },
  { value: "SEN", label: "Sénégal" },
  { value: "MLI", label: "Mali" },
  { value: "COD", label: "Côte d'Ivoire" },
  { value: "GNB", label: "Guinée-Bissau" },
  { value: "GIN", label: "Guinée" },
  { value: "GAB", label: "Gabon" },
  { value: "NAM", label: "Namibie" },
  { value: "BWA", label: "Botswana" },
  { value: "ZAF", label: "Afrique du Sud" },
  { value: "MOZ", label: "Mozambique" },
  { value: "MWI", label: "Malawi" },
  { value: "TCD", label: "Tchad" },
  { value: "NER", label: "Niger" },
  { value: "BFA", label: "Burkina Faso" },
  { value: "BDI", label: "Burundi" },
  { value: "SOM", label: "Somalie" },
  { value: "ERI", label: "Érythrée" },
  { value: "DJI", label: "Djibouti" },
  { value: "LBY", label: "Libye" },
  { value: "TUN", label: "Tunisie" },
  { value: "MAR", label: "Maroc" },
  { value: "EGY", label: "Égypte" },
  { value: "ALG", label: "Algérie" },
  { value: "SDN", label: "Soudan" },
];

const otherCountries = [
  { value: "BEL", label: "Belgique" },
  { value: "FRA", label: "France" },
  { value: "USA", label: "États-Unis" },
  { value: "CAN", label: "Canada" },
  { value: "GBR", label: "Royaume-Uni" },
  { value: "DEU", label: "Allemagne" },
  { value: "NLD", label: "Pays-Bas" },
  { value: "CHE", label: "Suisse" },
];

const allCountries = [
  { value: "", label: "Sélectionnez un pays" },
  { value: "---", label: "──────── Afrique ────────", disabled: true },
  ...africanCountries,
  { value: "---2", label: "──────── Autres ────────", disabled: true },
  ...otherCountries,
];

const languages = [
  { value: "fr", label: "Français" },
  { value: "ln", label: "Lingala" },
  { value: "sw", label: "Swahili" },
  { value: "ki", label: "Kikongo" },
  { value: "ts", label: "Tshiluba" },
  { value: "en", label: "Anglais" },
];

export function ProfileSettings({ profile, onSaved }: ProfileSettingsProps) {
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [language, setLanguage] = useState(profile.language ?? "fr");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        country: country || null,
        language,
        timezone: timezone || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo de profil</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <Avatar
            src={avatarUrl}
            firstName={firstName}
            lastName={lastName}
            size="xl"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              <Camera className="h-4 w-4" />
              Changer la photo
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG. Max 2 Mo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <ErrorMessage message={error} />

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Profil mis à jour avec succès.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Select
            label="Pays"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={allCountries.filter((c) => !c.value.startsWith("---"))}
          />

          <Select
            label="Langue"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={languages}
          />

          <Select
            label="Fuseau horaire"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={[
              { value: "", label: "Par défaut" },
              { value: "Africa/Kinshasa", label: "Kinshasa (UTC+1)" },
              { value: "Africa/Lubumbashi", label: "Lubumbashi (UTC+2)" },
              { value: "Africa/Bujumbura", label: "Bujumbura (UTC+2)" },
              { value: "Africa/Kigali", label: "Kigali (UTC+2)" },
              { value: "Africa/Nairobi", label: "Nairobi (UTC+3)" },
              { value: "Africa/Dar_es_Salaam", label: "Dar es Salaam (UTC+3)" },
              { value: "Europe/Paris", label: "Paris (UTC+1)" },
              { value: "Europe/Brussels", label: "Bruxelles (UTC+1)" },
              { value: "America/New_York", label: "New York (UTC-5)" },
              { value: "America/Chicago", label: "Chicago (UTC-6)" },
              { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
            ]}
          />

          <Button type="submit" loading={saving}>
            Enregistrer les modifications
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
