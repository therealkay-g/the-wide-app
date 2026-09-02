"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Printer,
  Plus,
  Users,
  Heart,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

export type ViewMode = "all" | "paternal" | "maternal" | "ancestors" | "descendants";
export type ExportFormat = "json" | "csv" | "gedcom";

interface TreeToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onSearch: (query: string) => void;
  onPrint: () => void;
  onExport: (format: ExportFormat) => void;
  generationCount?: number;
  onMaxGenerationsChange?: (n: number) => void;
  onAddPerson?: () => void;
  onAddUnion?: () => void;
}

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "all", label: "Toute la famille" },
  { value: "paternal", label: "Branche paternelle" },
  { value: "maternal", label: "Branche maternelle" },
  { value: "ancestors", label: "Ancêtres" },
  { value: "descendants", label: "Descendants" },
];

export function TreeToolbar({
  viewMode,
  onViewModeChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSearch,
  onPrint,
  onExport,
  generationCount = 5,
  onMaxGenerationsChange,
  onAddPerson,
  onAddUnion,
}: TreeToolbarProps) {
  const [searchValue, setSearchValue] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showView, setShowView] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) {
        setShowView(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-wrap">
      {/* View mode */}
      <div className="relative" ref={viewRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowView(!showView)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {VIEW_MODES.find((v) => v.value === viewMode)?.label ?? "Vue"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
        {showView && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px] py-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.value}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  viewMode === mode.value
                    ? "font-medium text-[#0B6E4F] dark:text-emerald-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  onViewModeChange(mode.value);
                  setShowView(false);
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={onZoomOut} title="Zoom arrière">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <button
          onClick={onZoomReset}
          className="text-xs text-gray-500 dark:text-gray-400 w-10 text-center hover:text-gray-700 dark:hover:text-gray-200"
          title="Réinitialiser le zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button variant="ghost" size="icon-sm" onClick={onZoomIn} title="Zoom avant">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onZoomReset} title="Ajuster">
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Generations */}
      {onMaxGenerationsChange && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Générations
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={generationCount}
              onChange={(e) => onMaxGenerationsChange(Number(e.target.value))}
              className="w-20 h-1 accent-[#0B6E4F]"
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4">
              {generationCount}
            </span>
          </div>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
        </>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher une personne..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {onAddPerson && (
          <Button variant="outline" size="sm" onClick={onAddPerson} className="gap-1">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Personne</span>
          </Button>
        )}
        {onAddUnion && (
          <Button variant="outline" size="sm" onClick={onAddUnion} className="gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Union</span>
          </Button>
        )}
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Export */}
      <div className="relative" ref={exportRef}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowExport(!showExport)}
          title="Exporter"
        >
          <Download className="h-4 w-4" />
        </Button>
        {showExport && (
          <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { onExport("json"); setShowExport(false); }}
            >
              JSON
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { onExport("csv"); setShowExport(false); }}
            >
              CSV
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => { onExport("gedcom"); setShowExport(false); }}
            >
              GEDCOM
            </button>
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon-sm" onClick={onPrint} title="Imprimer">
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}
