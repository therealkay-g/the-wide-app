"use client";

import { ArrowRight, Pencil, Trash2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MigrationRecord } from "@/types";

interface MigrationCardProps {
  migration: MigrationRecord;
  personName?: string;
  onEdit: (migration: MigrationRecord) => void;
  onDelete: (migration: MigrationRecord) => void;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MigrationCard({ migration, personName, onEdit, onDelete }: MigrationCardProps) {
  const origin = migration.origin_place || "Lieu inconnu";
  const destination = migration.destination_place || "Lieu inconnu";
  const dateStr = formatDate(migration.date_start);
  const periodStr =
    migration.date_start && migration.date_end
      ? `${formatDate(migration.date_start)} – ${formatDate(migration.date_end)}`
      : "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            {personName && (
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {personName}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {origin}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-[#0B6E4F] flex-shrink-0" />
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <MapPin className="h-4 w-4 text-[#0B6E4F]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {destination}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              {dateStr && <span>{dateStr}</span>}
              {periodStr && !dateStr && <span>{periodStr}</span>}
              {migration.reason && (
                <span className="italic">Motif : {migration.reason}</span>
              )}
            </div>

            {migration.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {migration.notes}
              </p>
            )}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(migration)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(migration)}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
