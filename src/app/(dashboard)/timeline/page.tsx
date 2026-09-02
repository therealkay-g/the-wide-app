"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { getEventsByTree, createEvent, deleteEvent } from "@/services/events";
import { getPersons } from "@/services/persons";
import { getPlaces } from "@/services/places";
import { getTrees } from "@/services/trees";
import { TimelineItem } from "@/components/timeline/timeline-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  Plus,
  Clock,
  Baby,
  Heart,
  Skull,
  MapPin,
  Home,
  GraduationCap,
  Briefcase,
  Shield,
  Users,
  Star,
  Droplets,
} from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/types/constants";
import { DATE_PRECISION_LABELS } from "@/types/constants";
import type { Event, EventType, DatePrecision, CertaintyLevel, Person, Place } from "@/types";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  BIRTH: <Baby className="h-4 w-4" />,
  BAPTISM: <Droplets className="h-4 w-4" />,
  MARRIAGE: <Heart className="h-4 w-4" />,
  DEATH: <Skull className="h-4 w-4" />,
  RESIDENCE: <Home className="h-4 w-4" />,
  MIGRATION: <MapPin className="h-4 w-4" />,
  EDUCATION: <GraduationCap className="h-4 w-4" />,
  OCCUPATION: <Briefcase className="h-4 w-4" />,
  MILITARY_SERVICE: <Shield className="h-4 w-4" />,
  FAMILY_EVENT: <Users className="h-4 w-4" />,
  OTHER: <Star className="h-4 w-4" />,
};

export default function TimelinePage() {
  const { user, loading: userLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [treeId, setTreeId] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [personFilter, setPersonFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    person_id: "",
    type: "BIRTH" as EventType,
    date: "",
    date_precision: "EXACT" as DatePrecision,
    place_id: "",
    description: "",
    certainty: "UNKNOWN" as CertaintyLevel,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: families } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id);

      if (!families?.length) {
        setLoading(false);
        return;
      }

      const familyIds = families.map((m) => m.family_id);
      const { data: trees } = await supabase
        .from("trees")
        .select("id, family_id")
        .in("family_id", familyIds)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!trees?.length) {
        setLoading(false);
        return;
      }

      const tid = trees[0].id;
      setTreeId(tid);
      setFamilyId(trees[0].family_id);

      const [eventsRes, personsRes, placesRes] = await Promise.all([
        getEventsByTree(trees[0].family_id),
        getPersons(tid),
        getPlaces(trees[0].family_id),
      ]);

      if (eventsRes.error) setError(eventsRes.error);
      setEvents(eventsRes.data);
      setPersons(personsRes.data);
      setPlaces(placesRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const personMap = new Map(persons.map((p) => [p.id, p]));
  const placeMap = new Map(places.map((p) => [p.id, p]));

  const filteredEvents = events.filter((e) => {
    if (personFilter && e.person_id !== personFilter) return false;
    if (typeFilter && e.event_type !== typeFilter) return false;
    if (startDate && e.date_value && e.date_value < startDate) return false;
    if (endDate && e.date_value && e.date_value > endDate) return false;
    return true;
  });

  const handleCreateEvent = async () => {
    if (!user) return;
    if (!familyId || !formData.person_id) {
      setFormError("Veuillez sélectionner une personne");
      return;
    }

    setSaving(true);
    setFormError(null);

    const result = await createEvent({
      person_id: formData.person_id,
      family_id: familyId,
      event_type: formData.type,
      date_value: formData.date || null,
      date_precision: formData.date_precision,
      place_id: formData.place_id || null,
      description: formData.description || null,
      source_id: null,
      certainty: formData.certainty,
      created_by: user.id,
    });

    if (result.error) {
      setFormError(result.error);
      setSaving(false);
      return;
    }

    setDialogOpen(false);
    setFormData({
      person_id: "",
      type: "BIRTH",
      date: "",
      date_precision: "EXACT",
      place_id: "",
      description: "",
      certainty: "UNKNOWN",
    });
    await fetchData();
    setSaving(false);
  };

  const personOptions = persons.map((p) => ({
    value: p.id,
    label: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Sans nom",
  }));

  const placeOptions = places.map((p) => ({
    value: p.id,
    label: `${p.name}${p.country ? `, ${p.country}` : ""}`,
  }));

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chronologie
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {filteredEvents.length} événement{filteredEvents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>

      <ErrorMessage message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Personne"
          value={personFilter}
          onChange={(e) => setPersonFilter(e.target.value)}
          options={[
            { value: "", label: "Toutes les personnes" },
            ...personOptions,
          ]}
          placeholder="Toutes les personnes"
        />
        <Select
          label="Type d'événement"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: "", label: "Tous les types" },
            ...Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            })),
          ]}
          placeholder="Tous les types"
        />
        <Input
          label="Date de début"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Date de fin"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<Clock className="h-12 w-12" />}
              title="Aucun événement"
              description="Ajoutez des événements pour construire la chronologie de votre famille."
              action={
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Ajouter un événement
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun événement ne correspond aux filtres sélectionnés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-4">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-0">
            {filteredEvents.map((event) => (
              <TimelineItem
                key={event.id}
                event={event}
                personName={
                  personMap.get(event.person_id)
                    ? `${personMap.get(event.person_id)!.first_name || ""} ${personMap.get(event.person_id)!.last_name || ""}`.trim()
                    : undefined
                }
                placeName={
                  event.place_id
                    ? placeMap.get(event.place_id)?.name
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Ajouter un événement"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateEvent} loading={saving}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4 min-w-[320px]">
          <ErrorMessage message={formError} />
          <Select
            label="Personne"
            value={formData.person_id}
            onChange={(e) =>
              setFormData({ ...formData, person_id: e.target.value })
            }
            options={personOptions}
            placeholder="Sélectionner une personne"
          />
          <Select
            label="Type d'événement"
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as EventType })
            }
            options={Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />
          <Select
            label="Précision de la date"
            value={formData.date_precision}
            onChange={(e) =>
              setFormData({
                ...formData,
                date_precision: e.target.value as DatePrecision,
              })
            }
            options={Object.entries(DATE_PRECISION_LABELS).map(([v, l]) => ({
              value: v,
              label: l,
            }))}
          />
          <Select
            label="Lieu"
            value={formData.place_id}
            onChange={(e) =>
              setFormData({ ...formData, place_id: e.target.value })
            }
            options={[{ value: "", label: "Aucun lieu" }, ...placeOptions]}
            placeholder="Sélectionner un lieu"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6E4F] focus-visible:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="Description de l'événement"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
