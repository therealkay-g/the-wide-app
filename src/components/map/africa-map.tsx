"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Place } from "@/types";

interface AfricaMapProps {
  places: Place[];
  onPlaceClick: (place: Place) => void;
  selectedPlaceId?: string;
}

export function AfricaMap({ places, onPlaceClick, selectedPlaceId }: AfricaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);
  const [viewBox, setViewBox] = useState({ x: -20, y: -35, w: 75, h: 70 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const latLngToSvg = (lat: number, lng: number) => {
    const x = lng;
    const y = -lat;
    return { x, y };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      const newW = viewBox.w * factor;
      const newH = viewBox.h * factor;
      const cx = viewBox.x + viewBox.w / 2;
      const cy = viewBox.y + viewBox.h / 2;
      setViewBox({
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      });
      setZoom((z) => z * (1 / factor));
    },
    [viewBox]
  );

  return (
    <div className="relative w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-sky-50 dark:bg-gray-900 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-[500px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="#dbeafe" />

        {/* Simplified Africa outline */}
        <path
          d="M -17.5 15 L -17 17 L -16 19 L -15.5 21 L -15 23 L -14 25 L -12 28 L -10 30 L -8 33 L -5 35 L -2 36 L 1 37 L 3 36 L 5 35 L 8 33 L 10 31 L 12 30 L 14 28 L 15 25 L 15.5 22 L 14 20 L 13 18 L 12 16 L 13 14 L 14 12 L 15 10 L 16 8 L 18 5 L 20 3 L 22 1 L 30 -2 L 35 -5 L 40 -8 L 45 -12 L 50 -15 L 51 -18 L 50 -20 L 48 -22 L 45 -25 L 42 -27 L 40 -28 L 35 -30 L 30 -32 L 25 -34 L 20 -35 L 15 -35 L 10 -34 L 5 -33 L 0 -32 L -5 -30 L -10 -28 L -15 -25 L -18 -20 L -19 -17 L -18 -14 L -17 -10 L -16 -5 L -15 0 L -15.5 5 L -17 10 L -17.5 15 Z"
          fill="#e5e7eb"
          stroke="#9ca3af"
          strokeWidth="0.3"
        />

        {/* DRC highlight */}
        <path
          d="M 12 5 L 15 3 L 18 2 L 22 1 L 28 -1 L 30 -3 L 31 -5 L 30 -8 L 28 -12 L 25 -14 L 22 -13 L 18 -12 L 15 -10 L 13 -8 L 12 -5 L 11 -2 L 11 2 L 12 5 Z"
          fill="#bbf7d0"
          stroke="#16a34a"
          strokeWidth="0.4"
        />
        <text x="20" y="-4" fontSize="1.8" fill="#166534" fontWeight="bold" textAnchor="middle">
          RDC
        </text>

        {/* Place markers */}
        {places.map((place) => {
          if (place.latitude == null || place.longitude == null) return null;
          const pos = latLngToSvg(place.latitude, place.longitude);
          const isSelected = place.id === selectedPlaceId;
          return (
            <g
              key={place.id}
              onClick={(e) => {
                e.stopPropagation();
                onPlaceClick(place);
              }}
              onMouseEnter={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) {
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    name: place.name,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              className="cursor-pointer"
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isSelected ? 1.2 : 0.8}
                fill={isSelected ? "#ef4444" : "#dc2626"}
                stroke="white"
                strokeWidth="0.25"
              />
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={2}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.2"
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          {tooltip.name}
        </div>
      )}

      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          onClick={() => {
            const cx = viewBox.x + viewBox.w / 2;
            const cy = viewBox.y + viewBox.h / 2;
            const newW = viewBox.w * 0.8;
            const newH = viewBox.h * 0.8;
            setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
            setZoom((z) => z * 1.25);
          }}
          className="h-7 w-7 rounded bg-white/80 border border-gray-300 flex items-center justify-center text-sm font-bold hover:bg-white"
        >
          +
        </button>
        <button
          onClick={() => {
            const cx = viewBox.x + viewBox.w / 2;
            const cy = viewBox.y + viewBox.h / 2;
            const newW = viewBox.w * 1.25;
            const newH = viewBox.h * 1.25;
            setViewBox({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
            setZoom((z) => z * 0.8);
          }}
          className="h-7 w-7 rounded bg-white/80 border border-gray-300 flex items-center justify-center text-sm font-bold hover:bg-white"
        >
          −
        </button>
        <button
          onClick={() => {
            setViewBox({ x: -20, y: -35, w: 75, h: 70 });
            setZoom(1);
          }}
          className="h-7 px-2 rounded bg-white/80 border border-gray-300 text-xs hover:bg-white"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
