"use client";

import { ZoomIn, ZoomOut, Maximize2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TreeToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onAddPerson: () => void;
}

export function TreeToolbar({
  onZoomIn,
  onZoomOut,
  onFit,
  onAddPerson,
}: TreeToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomIn}
          title="Zoom avant"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onZoomOut}
          title="Zoom arrière"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFit}
          title="Ajuster la vue"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <Button size="sm" onClick={onAddPerson}>
        <Plus className="h-4 w-4" />
        Ajouter
      </Button>
    </div>
  );
}
