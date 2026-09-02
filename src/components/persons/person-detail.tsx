"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PersonForm } from "./person-form";
import { AddRelationDialog } from "./add-relation-dialog";
import { AddEventDialog } from "./add-event-dialog";
import { UnionCard } from "@/components/unions/union-card";
import { UnionForm } from "@/components/unions/union-form";
import { getPerson, deletePerson, getPersons } from "@/services/persons";
import { getUnionsForPerson } from "@/services/unions";
import {
  getParents,
  getChildren,
  getSpouses,
  getSiblings,
} from "@/services/relationships";
import { getEventsByPerson } from "@/services/events";
import type { Person, Relationship, Event, UnionWithPersons } from "@/types";
import {
  CERTAINTY_LABELS,
  RELATIONSHIP_LABELS,
  EVENT_TYPE_LABELS,
} from "@/types/constants";
import {
  Edit,
  Trash2,
  Plus,
  UserPlus,
  Baby,
  Heart,
  Users,
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  Briefcase,
  Globe,
  Phone,
  Mail,
  Network,
  GitBranch,
} from "lucide-react";

interface PersonDetailProps {
  personId: string;
}

const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Célibataire",
  MARRIED: "Marié(e)",
  POLYGAMOUS: "Polygame",
  WIDOWED: "Veuf/Veuve",
  DIVORCED: "Divorcé(e)",
  SEPARATED: "Séparé(e)",
  FREE_UNION: "Union libre",
  UNKNOWN: "Inconnu",
};

interface RelatedPerson extends Relationship {
  related_person: Person | null;
}

function formatDateDisplay(date: string | null, precision: string): string {
  if (!date) return "";
  const d = new Date(date);
  switch (precision) {
    case "EXACT":
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "YEAR":
      return d.getFullYear().toString();
    case "MONTH":
      return d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    case "APPROXIMATE":
      return `~${d.getFullYear()}`;
    case "BEFORE":
      return `avant ${d.getFullYear()}`;
    case "AFTER":
      return `après ${d.getFullYear()}`;
    default:
      return d.getFullYear().toString();
  }
}

function certaintyVariant(
  level: string
): "success" | "info" | "warning" | "danger" | "secondary" | "outline" {
  switch (level) {
    case "VERIFIED":
    case "CONFIRMED":
      return "success";
    case "FAMILY_TESTIMONY":
    case "PROBABLE":
      return "info";
    case "HYPOTHESIS":
      return "warning";
    case "CONTRADICTORY":
      return "danger";
    default:
      return "outline";
  }
}

function eventTypeIcon(type: string) {
  switch (type) {
    case "BIRTH":
      return <Baby className="h-4 w-4" />;
    case "DEATH":
      return <span className="text-sm">✝</span>;
    case "MARRIAGE":
      return <Heart className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

function eventTypeVariant(
  type: string
): "success" | "info" | "warning" | "danger" | "secondary" | "outline" {
  switch (type) {
    case "BIRTH":
      return "success";
    case "DEATH":
      return "danger";
    case "MARRIAGE":
      return "info";
    case "BAPTISM":
      return "secondary";
    default:
      return "outline";
  }
}

export function PersonDetail({ personId }: PersonDetailProps) {
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [parents, setParents] = useState<RelatedPerson[]>([]);
  const [children, setChildren] = useState<RelatedPerson[]>([]);
  const [spouses, setSpouses] = useState<RelatedPerson[]>([]);
  const [siblings, setSiblings] = useState<RelatedPerson[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [unions, setUnions] = useState<UnionWithPersons[]>([]);
  const [familyPersons, setFamilyPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addParentOpen, setAddParentOpen] = useState(false);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [addSpouseOpen, setAddSpouseOpen] = useState(false);
  const [addSiblingOpen, setAddSiblingOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [unionFormOpen, setUnionFormOpen] = useState(false);
  const [editingUnion, setEditingUnion] = useState<
    UnionWithPersons | undefined
  >(undefined);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: personData, error: personErr } = await getPerson(personId);
    if (personErr || !personData) {
      setError(personErr || "Personne introuvable");
      setLoading(false);
      return;
    }

    setPerson(personData);

    const [parentsRes, childrenRes, spousesRes, siblingsRes, eventsRes, unionsRes] =
      await Promise.all([
        getParents(personId),
        getChildren(personId),
        getSpouses(personId),
        getSiblings(personId),
        getEventsByPerson(personId),
        getUnionsForPerson(personId),
      ]);

    setParents(parentsRes.data as RelatedPerson[]);
    setChildren(childrenRes.data as RelatedPerson[]);
    setSpouses(spousesRes.data as RelatedPerson[]);
    setSiblings(siblingsRes.data as RelatedPerson[]);
    setEvents(eventsRes.data);
    setUnions(unionsRes.data);

    if (personData.tree_id) {
      const personsRes = await getPersons(personData.tree_id, {
        pageSize: 500,
      });
      setFamilyPersons(personsRes.data);
    }

    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    setDeleting(true);
    const { error: err } = await deletePerson(personId);
    if (err) {
      setError(err);
      setDeleting(false);
      return;
    }
    router.push("/persons");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <ErrorMessage message={error || "Personne introuvable"} />
      </div>
    );
  }

  const fullName = [
    person.first_name,
    person.middle_name,
    person.last_name,
    person.post_name,
  ]
    .filter(Boolean)
    .join(" ");

  const birthDateStr = formatDateDisplay(
    person.birth_date,
    person.birth_date_precision
  );
  const deathDateStr = formatDateDisplay(
    person.death_date,
    person.death_date_precision
  );

  function renderRelatedPersons(
    items: RelatedPerson[],
    emptyMessage: string
  ) {
    if (items.length === 0) {
      return (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          {emptyMessage}
        </p>
      );
    }
    return (
      <div className="space-y-2">
        {items.map((rel) => {
          const rp = rel.related_person;
          if (!rp) return null;
          const name = [rp.first_name, rp.last_name]
            .filter(Boolean)
            .join(" ");
          const dates = [
            formatDateDisplay(rp.birth_date, rp.birth_date_precision),
            rp.death_date
              ? formatDateDisplay(rp.death_date, rp.death_date_precision)
              : null,
          ]
            .filter(Boolean)
            .join(" — ");
          return (
            <Link
              key={rel.id}
              href={`/persons/${rp.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Avatar
                src={rp.profile_photo}
                firstName={rp.first_name}
                lastName={rp.last_name}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {name || "Sans nom"}
                </p>
                {dates && (
                  <p className="text-xs text-gray-500">{dates}</p>
                )}
              </div>
              {rel.relationship_type && (
                <Badge
                  variant="outline"
                  className="text-[10px] flex-shrink-0"
                >
                  {RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {fullName || "Sans nom"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar
              src={person.profile_photo}
              firstName={person.first_name}
              lastName={person.last_name}
              size="xl"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {fullName || "Sans nom"}
                </h2>
                {person.nickname && (
                  <span className="text-sm text-gray-500">
                    (&quot;{person.nickname}&quot;)
                  </span>
                )}
                {person.traditional_name && (
                  <span className="text-sm text-gray-500">
                    — {person.traditional_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {person.gender === "male"
                    ? "Homme"
                    : person.gender === "female"
                      ? "Femme"
                      : person.gender === "other"
                        ? "Autre"
                        : "Genre inconnu"}
                </span>
                {birthDateStr && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Né(e) le {birthDateStr}
                  </span>
                )}
                {deathDateStr && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Décédé(e) le {deathDateStr}
                  </span>
                )}
              </div>

              {(person.village ||
                person.city ||
                person.province ||
                person.country) && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {[
                    person.village,
                    person.city,
                    person.province,
                    person.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}

              {person.certainty && person.certainty !== "UNKNOWN" && (
                <Badge variant={certaintyVariant(person.certainty)}>
                  {CERTAINTY_LABELS[person.certainty]}
                </Badge>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={person.is_alive === false ? "danger" : "success"}>
                  {person.is_alive === false ? "Décédé(e)" : "Vivant(e)"}
                </Badge>
                {person.marital_status &&
                  person.marital_status !== "UNKNOWN" && (
                    <Badge variant="secondary">
                      {MARITAL_STATUS_LABELS[person.marital_status] ||
                        person.marital_status}
                    </Badge>
                  )}
              </div>

              {(person.profession ||
                person.nationality ||
                person.phone ||
                person.email) && (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 pt-1">
                  {person.profession && (
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      {person.profession}
                    </p>
                  )}
                  {person.nationality && (
                    <p className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {person.nationality}
                    </p>
                  )}
                  {person.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {person.phone}
                    </p>
                  )}
                  {person.email && (
                    <p className="flex items-center gap-1.5 break-all">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      {person.email}
                    </p>
                  )}
                </div>
              )}

              {(person.clan ||
                person.lineage ||
                person.family_origin) && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  {person.clan && <p>Clan : {person.clan}</p>}
                  {person.lineage && <p>Lignée : {person.lineage}</p>}
                  {person.family_origin && (
                    <p>Origine : {person.family_origin}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" />
          Modifier
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddParentOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un parent
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddChildOpen(true)}
        >
          <Baby className="h-4 w-4" />
          Ajouter un enfant
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddSpouseOpen(true)}
        >
          <Heart className="h-4 w-4" />
          Ajouter un conjoint
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddSiblingOpen(true)}
        >
          <Users className="h-4 w-4" />
          Ajouter un frère/une sœur
        </Button>
        <Link href={`/persons/${personId}/ancestors`}>
          <Button size="sm" variant="outline">
            <Network className="h-4 w-4" />
            Voir les ancêtres
          </Button>
        </Link>
        <Link href={`/persons/${personId}/descendants`}>
          <Button size="sm" variant="outline">
            <GitBranch className="h-4 w-4" />
            Voir les descendants
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditingUnion(undefined);
            setUnionFormOpen(true);
          }}
        >
          <Heart className="h-4 w-4" />
          Ajouter une union
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddEventOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter un événement
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-gray-500" />
              Famille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Parents
              </h4>
              {renderRelatedPersons(parents, "Aucun parent enregistré")}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Frères et sœurs
              </h4>
              {renderRelatedPersons(
                siblings,
                "Aucun frère/une sœur enregistré"
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Conjoint(e)s
              </h4>
              {renderRelatedPersons(spouses, "Aucun conjoint enregistré")}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Enfants
              </h4>
              {renderRelatedPersons(children, "Aucun enfant enregistré")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-gray-500" />
              Événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-8 w-8" />}
                title="Aucun événement"
                description="Ajoutez des événements pour reconstituer la vie de cette personne."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddEventOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {events.map((evt) => {
                  const dateStr = formatDateDisplay(
                    evt.date_value,
                    evt.date_precision
                  );
                  return (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="mt-1 text-gray-400">
                        {eventTypeIcon(evt.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                          </span>
                          <Badge
                            variant={eventTypeVariant(evt.event_type)}
                            className="text-[10px]"
                          >
                            {evt.event_type}
                          </Badge>
                        </div>
                        {dateStr && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dateStr}
                          </p>
                        )}
                        {evt.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {evt.description}
                          </p>
                        )}
                      </div>
                      {evt.certainty && evt.certainty !== "UNKNOWN" && (
                        <Badge
                          variant={certaintyVariant(evt.certainty)}
                          className="text-[10px] flex-shrink-0"
                        >
                          {CERTAINTY_LABELS[evt.certainty]}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-gray-500" />
            Unions
            {unions.length > 0 && (
              <Badge variant="secondary">{unions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unions.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-8 w-8" />}
              title="Aucune union"
              description="Enregistrez les mariages et relations de cette personne."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingUnion(undefined);
                    setUnionFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une union
                </Button>
              }
            />
          ) : (
            unions.map((u) => (
              <UnionCard
                key={u.id}
                union={u}
                onClick={() => {
                  setEditingUnion(u);
                  setUnionFormOpen(true);
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      {person.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {person.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {person.biography && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biographie</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {person.biography}
            </p>
          </CardContent>
        </Card>
      )}

      <PersonForm
        person={person}
        treeId={person.tree_id}
        familyId={person.family_id}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          fetchData();
        }}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer cette personne"
        message="Cette action est irréversible. Toutes les relations et événements associés seront supprimés."
        confirmLabel={deleting ? "Suppression..." : "Supprimer"}
        cancelLabel="Annuler"
        destructive
      />

      <AddRelationDialog
        open={addParentOpen}
        onClose={() => setAddParentOpen(false)}
        personId={personId}
        treeId={person.tree_id}
        familyId={person.family_id}
        relationType="parent"
        onCreated={fetchData}
      />

      <AddRelationDialog
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        personId={personId}
        treeId={person.tree_id}
        familyId={person.family_id}
        relationType="child"
        onCreated={fetchData}
      />

      <AddRelationDialog
        open={addSpouseOpen}
        onClose={() => setAddSpouseOpen(false)}
        personId={personId}
        treeId={person.tree_id}
        familyId={person.family_id}
        relationType="spouse"
        onCreated={fetchData}
      />

      <AddRelationDialog
        open={addSiblingOpen}
        onClose={() => setAddSiblingOpen(false)}
        personId={personId}
        treeId={person.tree_id}
        familyId={person.family_id}
        relationType="sibling"
        onCreated={fetchData}
      />

      <AddEventDialog
        open={addEventOpen}
        onClose={() => setAddEventOpen(false)}
        personId={personId}
        treeId={person.tree_id}
        familyId={person.family_id}
        createdBy={person.created_by}
        onCreated={fetchData}
      />

      <UnionForm
        open={unionFormOpen}
        onClose={() => setUnionFormOpen(false)}
        familyId={person.family_id}
        personAId={personId}
        union={editingUnion}
        persons={familyPersons}
        onSaved={() => {
          setUnionFormOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
