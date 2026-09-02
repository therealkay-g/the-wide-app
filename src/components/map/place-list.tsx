"use client";

import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/types";

interface PlaceListProps {
  places: Place[];
  selectedPlaceId?: string;
  onSelect: (place: Place) => void;
}

function formatCoords(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return "Pas de coordonnées";
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function getSubtitle(place: Place): string {
  const parts = [place.province, place.country].filter(Boolean);
  return parts.join(", ");
}

export function PlaceList({ places, selectedPlaceId, onSelect }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Aucun lieu enregistré
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {places.map((place) => {
        const isSelected = place.id === selectedPlaceId;
        return (
          <button
            key={place.id}
            onClick={() => onSelect(place)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
              isSelected && "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 p-1.5 rounded-lg flex-shrink-0",
                  isSelected
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                <MapPin className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {place.name}
                </p>
                {getSubtitle(place) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getSubtitle(place)}
                  </p>
                )}
                {place.latitude != null && place.longitude != null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <Navigation className="h-3 w-3" />
                    {formatCoords(place.latitude, place.longitude)}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
