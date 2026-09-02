"use client";

import { Calendar, Heart, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Person, UnionWithPersons } from "@/types";

interface UnionCardProps {
  union: UnionWithPersons;
  onClick?: () => void;
}

const UNION_TYPE_LABELS: Record<string, string> = {
  MARRIAGE: "Mariage",
  TRADITIONAL_MARRIAGE: "Mariage traditionnel",
  CIVIL_MARRIAGE: "Mariage civil",
  RELIGIOUS_MARRIAGE: "Mariage religieux",
  FREE_UNION: "Union libre",
  CONCUBINAGE: "Concubinage",
  OTHER: "Autre",
};

const UNION_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  SEPARATED: { label: "Séparé(e)s", variant: "warning" },
  DIVORCED: { label: "Divorcé(e)s", variant: "danger" },
  WIDOWED: { label: "Veuf/Veuve", variant: "info" },
  DISSOLVED: { label: "Dissoute", variant: "outline" },
};

function displayName(person?: Person | null): string {
  if (!person) return "Inconnu";
  return (
    [person.first_name, person.last_name].filter(Boolean).join(" ") || "Sans nom"
  );
}

function yearOf(date?: string | null): string | null {
  if (!date) return null;
  return date.slice(0, 4);
}

export function UnionCard({ union, onClick }: UnionCardProps) {
  const personA = union.person_a;
  const personB = union.person_b;

  const period = [yearOf(union.start_date), yearOf(union.end_date)]
    .filter(Boolean)
    .join(" – ");

  const childrenCount = union.children?.length ?? 0;

  const statusConfig = union.status
    ? UNION_STATUS_CONFIG[union.status]
    : undefined;

  return (
    <Card
      className={cn(
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
            <Avatar
              src={personA?.profile_photo}
              firstName={personA?.first_name}
              lastName={personA?.last_name}
              size="sm"
              className="shrink-0"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
              {displayName(personA)}
            </span>
          </div>

          <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />

          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
            <Avatar
              src={personB?.profile_photo}
              firstName={personB?.first_name}
              lastName={personB?.last_name}
              size="sm"
              className="shrink-0"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
              {displayName(personB)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {union.union_type && (
            <Badge variant="info">
              {UNION_TYPE_LABELS[union.union_type] || union.union_type}
            </Badge>
          )}
          {statusConfig && (
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {period && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {period}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {childrenCount} enfant{childrenCount !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
