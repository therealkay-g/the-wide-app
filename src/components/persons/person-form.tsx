"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { createPerson, updatePerson } from "@/services/persons";
import { useAuth } from "@/hooks/use-auth";
import type {
  Gender,
  DatePrecision,
  CertaintyLevel,
  MaritalStatus,
  AdoptionType,
  Person,
} from "@/types";
import { DATE_PRECISION_LABELS, CERTAINTY_LABELS } from "@/types/constants";
import { ChevronDown, ChevronUp } from "lucide-react";

function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

interface PersonFormProps {
  person?: Person;
  treeId: string;
  familyId?: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const GENDER_OPTIONS = [
  { value: "unknown", label: "Inconnu" },
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

const DATE_PRECISION_OPTIONS = Object.entries(DATE_PRECISION_LABELS).map(
  ([value, label]) => ({ value, label })
);

const CERTAINTY_OPTIONS = Object.entries(CERTAINTY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: "SINGLE", label: "Célibataire" },
  { value: "MARRIED", label: "Marié(e)" },
  { value: "POLYGAMOUS", label: "Polygame" },
  { value: "WIDOWED", label: "Veuf/Veuve" },
  { value: "DIVORCED", label: "Divorcé(e)" },
  { value: "SEPARATED", label: "Séparé(e)" },
  { value: "FREE_UNION", label: "Union libre" },
  { value: "UNKNOWN", label: "Inconnu" },
];

const ADOPTION_TYPE_OPTIONS: { value: AdoptionType; label: string }[] = [
  { value: "BIOLOGICAL", label: "Biologique" },
  { value: "ADOPTED", label: "Adopté(e)" },
  { value: "LEGAL_GUARDIANSHIP", label: "Tutelle légale" },
  { value: "FOSTER", label: "Famille d'accueil" },
  { value: "CUSTOMARY", label: "Adoption coutumière" },
  { value: "UNKNOWN", label: "Inconnu" },
];

interface SectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, open, onToggle, children }: SectionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function PersonForm({
  person,
  treeId,
  familyId,
  open,
  onClose,
  onSaved,
}: PersonFormProps) {
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(person?.first_name ?? "");
  const [middleName, setMiddleName] = useState(person?.middle_name ?? "");
  const [lastName, setLastName] = useState(person?.last_name ?? "");
  const [postName, setPostName] = useState(person?.post_name ?? "");
  const [nickname, setNickname] = useState(person?.nickname ?? "");
  const [traditionalName, setTraditionalName] = useState(
    person?.traditional_name ?? ""
  );
  const [gender, setGender] = useState<Gender>(person?.gender ?? "unknown");

  const [birthDate, setBirthDate] = useState(person?.birth_date ?? "");
  const [birthDatePrecision, setBirthDatePrecision] = useState<DatePrecision>(
    person?.birth_date_precision ?? "UNKNOWN"
  );
  const [birthPlace, setBirthPlace] = useState(person?.birth_place_id ?? "");

  const [deathDate, setDeathDate] = useState(person?.death_date ?? "");
  const [deathDatePrecision, setDeathDatePrecision] = useState<DatePrecision>(
    person?.death_date_precision ?? "UNKNOWN"
  );
  const [deathPlace, setDeathPlace] = useState(person?.death_place_id ?? "");

  const [country, setCountry] = useState(person?.country ?? "");
  const [province, setProvince] = useState(person?.province ?? "");
  const [city, setCity] = useState(person?.city ?? "");
  const [territory, setTerritory] = useState(person?.territory ?? "");
  const [sector, setSector] = useState(person?.sector ?? "");
  const [chiefdom, setChiefdom] = useState(person?.chiefdom ?? "");
  const [groupement, setGroupement] = useState(person?.groupement ?? "");
  const [village, setVillage] = useState(person?.village ?? "");
  const [clan, setClan] = useState(person?.clan ?? "");
  const [lineage, setLineage] = useState(person?.lineage ?? "");
  const [familyOrigin, setFamilyOrigin] = useState(
    person?.family_origin ?? ""
  );

  const [profession, setProfession] = useState(person?.profession ?? "");
  const [nationality, setNationality] = useState(person?.nationality ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [email, setEmail] = useState(person?.email ?? "");

  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(
    person?.marital_status ?? "UNKNOWN"
  );
  const [isAlive, setIsAlive] = useState(person?.is_alive ?? true);
  const [adoptionType, setAdoptionType] = useState<AdoptionType>(
    person?.adoption_type ?? "UNKNOWN"
  );

  const [biography, setBiography] = useState(person?.biography ?? "");

  const [certainty, setCertainty] = useState<CertaintyLevel>(
    person?.certainty ?? "UNKNOWN"
  );
  const [notes, setNotes] = useState(person?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openIdentity, setOpenIdentity] = useState(true);
  const [openBirth, setOpenBirth] = useState(false);
  const [openDeath, setOpenDeath] = useState(false);
  const [openOrigins, setOpenOrigins] = useState(false);
  const [openProfessionContact, setOpenProfessionContact] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openBiography, setOpenBiography] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(person?.first_name ?? "");
      setMiddleName(person?.middle_name ?? "");
      setLastName(person?.last_name ?? "");
      setPostName(person?.post_name ?? "");
      setNickname(person?.nickname ?? "");
      setTraditionalName(person?.traditional_name ?? "");
      setGender(person?.gender ?? "unknown");
      setBirthDate(person?.birth_date ?? "");
      setBirthDatePrecision(person?.birth_date_precision ?? "UNKNOWN");
      setBirthPlace(person?.birth_place_id ?? "");
      setDeathDate(person?.death_date ?? "");
      setDeathDatePrecision(person?.death_date_precision ?? "UNKNOWN");
      setDeathPlace(person?.death_place_id ?? "");
      setCountry(person?.country ?? "");
      setProvince(person?.province ?? "");
      setCity(person?.city ?? "");
      setTerritory(person?.territory ?? "");
      setSector(person?.sector ?? "");
      setChiefdom(person?.chiefdom ?? "");
      setGroupement(person?.groupement ?? "");
      setVillage(person?.village ?? "");
      setClan(person?.clan ?? "");
      setLineage(person?.lineage ?? "");
      setFamilyOrigin(person?.family_origin ?? "");
      setProfession(person?.profession ?? "");
      setNationality(person?.nationality ?? "");
      setPhone(person?.phone ?? "");
      setEmail(person?.email ?? "");
      setMaritalStatus(person?.marital_status ?? "UNKNOWN");
      setIsAlive(person?.is_alive ?? true);
      setAdoptionType(person?.adoption_type ?? "UNKNOWN");
      setBiography(person?.biography ?? "");
      setCertainty(person?.certainty ?? "UNKNOWN");
      setNotes(person?.notes ?? "");
      setError(null);
    }
  }, [open, person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() && !lastName.trim()) {
      setError("Le prénom ou le nom de famille est requis.");
      return;
    }

    if (!user) {
      setError("Vous devez être connecté.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const data = {
      tree_id: treeId,
      family_id: person?.family_id ?? familyId ?? "",
      created_by: person?.created_by ?? user.id,
      first_name: firstName.trim() || null,
      middle_name: middleName.trim() || null,
      last_name: lastName.trim() || null,
      post_name: postName.trim() || null,
      nickname: nickname.trim() || null,
      traditional_name: traditionalName.trim() || null,
      gender,
      profile_photo: person?.profile_photo ?? null,
      birth_date: birthDate || null,
      birth_date_precision: birthDatePrecision,
      birth_place_id: isValidUuid(birthPlace) ? birthPlace : null,
      death_date: deathDate || null,
      death_date_precision: deathDatePrecision,
      death_place_id: isValidUuid(deathPlace) ? deathPlace : null,
      burial_place_id: person && isValidUuid(person.burial_place_id) ? person.burial_place_id : null,
      country: country.trim() || null,
      province: province.trim() || null,
      city: city.trim() || null,
      territory: territory.trim() || null,
      sector: sector.trim() || null,
      chiefdom: chiefdom.trim() || null,
      groupement: groupement.trim() || null,
      village: village.trim() || null,
      clan: clan.trim() || null,
      lineage: lineage.trim() || null,
      family_origin: familyOrigin.trim() || null,
      profession: profession.trim() || null,
      nationality: nationality.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      marital_status: maritalStatus,
      is_alive: isAlive,
      adoption_type: adoptionType,
      biography: biography.trim() || null,
      generation: person?.generation ?? 0,
      certainty,
      notes: notes.trim() || null,
    };

    let result;
    if (person) {
      result = await updatePerson(person.id, data);
    } else {
      result = await createPerson(data);
    }

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSaved();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={person ? "Modifier la personne" : "Ajouter une personne"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {person ? "Enregistrer" : "Créer la personne"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />

        <Section
          title="Identité"
          open={openIdentity}
          onToggle={() => setOpenIdentity(!openIdentity)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jean"
            />
            <Input
              label="Deuxième prénom"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />
            <Input
              label="Nom de famille"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Kabongo"
            />
            <Input
              label="Post-nom"
              value={postName}
              onChange={(e) => setPostName(e.target.value)}
            />
            <Input
              label="Surnom"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Input
              label="Nom traditionnel"
              value={traditionalName}
              onChange={(e) => setTraditionalName(e.target.value)}
            />
          </div>
          <Select
            label="Genre"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            options={GENDER_OPTIONS}
          />
        </Section>

        <Section
          title="Naissance"
          open={openBirth}
          onToggle={() => setOpenBirth(!openBirth)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date de naissance"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <Select
              label="Précision"
              value={birthDatePrecision}
              onChange={(e) =>
                setBirthDatePrecision(e.target.value as DatePrecision)
              }
              options={DATE_PRECISION_OPTIONS}
            />
          </div>
          <Input
            label="Lieu de naissance"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="ID du lieu"
          />
        </Section>

        <Section
          title="Décès"
          open={openDeath}
          onToggle={() => setOpenDeath(!openDeath)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date de décès"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
            />
            <Select
              label="Précision"
              value={deathDatePrecision}
              onChange={(e) =>
                setDeathDatePrecision(e.target.value as DatePrecision)
              }
              options={DATE_PRECISION_OPTIONS}
            />
          </div>
          <Input
            label="Lieu de décès"
            value={deathPlace}
            onChange={(e) => setDeathPlace(e.target.value)}
            placeholder="ID du lieu"
          />
        </Section>

        <Section
          title="Origines"
          open={openOrigins}
          onToggle={() => setOpenOrigins(!openOrigins)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Pays"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              label="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            />
            <Input
              label="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="Territoire"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
            />
            <Input
              label="Secteur"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
            <Input
              label="Chefferie"
              value={chiefdom}
              onChange={(e) => setChiefdom(e.target.value)}
            />
            <Input
              label="Groupement"
              value={groupement}
              onChange={(e) => setGroupement(e.target.value)}
            />
            <Input
              label="Village"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
            />
            <Input
              label="Clan"
              value={clan}
              onChange={(e) => setClan(e.target.value)}
            />
            <Input
              label="Lignée"
              value={lineage}
              onChange={(e) => setLineage(e.target.value)}
            />
          </div>
          <Input
            label="Origine familiale"
            value={familyOrigin}
            onChange={(e) => setFamilyOrigin(e.target.value)}
          />
        </Section>

        <Section
          title="Profession & Contact"
          open={openProfessionContact}
          onToggle={() => setOpenProfessionContact(!openProfessionContact)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="Agriculteur, enseignant..."
            />
            <Input
              label="Nationalité"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Congolaise"
            />
            <Input
              label="Téléphone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+243..."
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
          </div>
        </Section>

        <Section
          title="Statut"
          open={openStatus}
          onToggle={() => setOpenStatus(!openStatus)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Statut matrimonial"
              value={maritalStatus}
              onChange={(e) =>
                setMaritalStatus(e.target.value as MaritalStatus)
              }
              options={MARITAL_STATUS_OPTIONS}
            />
            <Select
              label="Type d'adoption"
              value={adoptionType}
              onChange={(e) => setAdoptionType(e.target.value as AdoptionType)}
              options={ADOPTION_TYPE_OPTIONS}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => setIsAlive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#0B6E4F] focus:ring-[#0B6E4F] cursor-pointer"
            />
            Cette personne est vivante
          </label>
        </Section>

        <Section
          title="Biographie"
          open={openBiography}
          onToggle={() => setOpenBiography(!openBiography)}
        >
          <Textarea
            label="Biographie"
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Racontez la vie de cette personne..."
            rows={8}
            className="min-h-[200px]"
          />
        </Section>

        <Select
          label="Niveau de certitude"
          value={certainty}
          onChange={(e) => setCertainty(e.target.value as CertaintyLevel)}
          options={CERTAINTY_OPTIONS}
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations supplémentaires..."
          rows={3}
        />
      </form>
    </Dialog>
  );
}
