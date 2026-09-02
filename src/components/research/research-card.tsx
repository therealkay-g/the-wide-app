"use client";

import { Pencil, Trash2, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Research } from "@/types";
import { RESEARCH_STATUS_LABELS, RESEARCH_STATUS_COLORS } from "@/types/constants";
import { truncate } from "@/lib/utils";

interface ResearchCardProps {
  research: Research;
  personName?: string;
  onEdit: (research: Research) => void;
  onDelete: (research: Research) => void;
}

const STATUS_BADGE_VARIANT: Record<string, "success" | "info" | "danger" | "warning" | "secondary" | "default"> = {
  TODO: "secondary",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  NO_RESULT: "warning",
  ABANDONED: "danger",
};

export function ResearchCard({ research, personName, onEdit, onDelete }: ResearchCardProps) {
  const statusLabel = RESEARCH_STATUS_LABELS[research.status] || research.status;
  const badgeVariant = STATUS_BADGE_VARIANT[research.status] || "default";
  const period = research.period_start && research.period_end
    ? `${research.period_start} – ${research.period_end}`
    : research.period_start || research.period_end || "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 text-[#D4A843] flex-shrink-0 mt-0.5" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {research.question}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={badgeVariant}>
                {statusLabel}
              </Badge>
              {personName && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {personName}
                </span>
              )}
              {period && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {period}
                </span>
              )}
            </div>

            {research.hypothesis && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Hypothèse :</span>{" "}
                {truncate(research.hypothesis, 200)}
              </p>
            )}

            {research.results && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Résultats :</span>{" "}
                {truncate(research.results, 200)}
              </p>
            )}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(research)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(research)}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
