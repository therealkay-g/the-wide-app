"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Gender, Person } from "@/types";
import { CERTAINTY_LABELS } from "@/types/constants";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
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
      return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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

function genderBorderColor(gender: Gender | null): string {
  switch (gender) {
    case "male":
      return "border-t-blue-500";
    case "female":
      return "border-t-pink-500";
    default:
      return "border-t-gray-400";
  }
}

function genderLabel(gender: Gender | null): string {
  switch (gender) {
    case "male":
      return "Homme";
    case "female":
      return "Femme";
    case "other":
      return "Autre";
    default:
      return "";
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

export function PersonCard({ person, onClick }: PersonCardProps) {
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

  const cardContent = (
    <Card
      className={cn(
        "border-t-4 hover:shadow-md transition-shadow cursor-pointer h-full",
        genderBorderColor(person.gender),
        onClick && "active:scale-[0.99]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={person.profile_photo}
            firstName={person.first_name}
            lastName={person.last_name}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {fullName || "Sans nom"}
              </h3>
              {genderLabel(person.gender) && (
                <span className="text-xs text-gray-400">
                  {genderLabel(person.gender)}
                </span>
              )}
            </div>

            {(birthDateStr || deathDateStr) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>
                  {birthDateStr}
                  {deathDateStr && ` — ${deathDateStr}`}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {person.village ||
                  person.city ||
                  person.province ||
                  "Lieu inconnu"}
              </span>
            </div>

            {person.certainty && person.certainty !== "UNKNOWN" && (
              <div className="mt-2">
                <Badge
                  variant={certaintyVariant(person.certainty)}
                  className="text-[10px]"
                >
                  {CERTAINTY_LABELS[person.certainty]}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) return cardContent;

  return (
    <Link href={`/persons/${person.id}`}>
      {cardContent}
    </Link>
  );
}
