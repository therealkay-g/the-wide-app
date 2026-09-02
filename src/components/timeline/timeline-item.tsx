"use client";

import {
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
  Circle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types";
import { EVENT_TYPE_LABELS } from "@/types/constants";
import { cn } from "@/lib/utils";
import { DATE_PRECISION_LABELS } from "@/types/constants";

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

const EVENT_DOT_COLORS: Record<string, string> = {
  BIRTH: "bg-green-500",
  BAPTISM: "bg-cyan-500",
  MARRIAGE: "bg-pink-500",
  DEATH: "bg-gray-500",
  RESIDENCE: "bg-amber-500",
  MIGRATION: "bg-blue-500",
  EDUCATION: "bg-purple-500",
  OCCUPATION: "bg-orange-500",
  MILITARY_SERVICE: "bg-red-500",
  FAMILY_EVENT: "bg-indigo-500",
  OTHER: "bg-gray-400",
};

const EVENT_BADGE_VARIANT: Record<string, "success" | "info" | "danger" | "warning" | "secondary" | "default"> = {
  BIRTH: "success",
  MARRIAGE: "info",
  DEATH: "danger",
  MIGRATION: "info",
  EDUCATION: "warning",
  OTHER: "default",
};

function formatEventDate(date: string | null, precision: string): string {
  if (!date) return "Date inconnue";
  const d = new Date(date);
  const prefix = DATE_PRECISION_LABELS[precision] === "Avant" ? "avant " :
                 DATE_PRECISION_LABELS[precision] === "Après" ? "après " : "";

  if (precision === "EXACT") {
    return prefix + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  if (precision === "MONTH") {
    return prefix + d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }
  if (precision === "YEAR" || precision === "APPROXIMATE" || precision === "BEFORE" || precision === "AFTER") {
    return prefix + d.toLocaleDateString("fr-FR", { year: "numeric" });
  }
  return d.toLocaleDateString("fr-FR", { year: "numeric" });
}

interface TimelineItemProps {
  event: Event;
  personName?: string;
  placeName?: string;
}

export function TimelineItem({ event, personName, placeName }: TimelineItemProps) {
  const dotColor = EVENT_DOT_COLORS[event.event_type] || "bg-gray-400";
  const icon = EVENT_ICONS[event.event_type] || <Circle className="h-4 w-4" />;
  const label = EVENT_TYPE_LABELS[event.event_type] || event.event_type;
  const badgeVariant = EVENT_BADGE_VARIANT[event.event_type] || "default";

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-4 w-4 rounded-full border-2 border-white dark:border-gray-900 z-10 mt-3 flex-shrink-0",
            dotColor
          )}
        />
        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      <Card className="flex-1 mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={badgeVariant} className="gap-1">
                  {icon}
                  {label}
                </Badge>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatEventDate(event.date_value, event.date_precision)}
                </span>
              </div>
              {personName && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {personName}
                </p>
              )}
              {placeName && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {placeName}
                </p>
              )}
              {event.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
