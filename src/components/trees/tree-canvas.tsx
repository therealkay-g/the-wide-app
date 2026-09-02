"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Person, Union } from "@/types";
import {
  calculateTreeLayout,
  type TreeLayout,
  type LayoutNode,
  type LayoutEdge,
  type UnionChildLink,
} from "@/lib/genealogy/tree-layout";
import { TreePersonNode } from "./tree-person-node";
import { TreeUnionNode } from "./tree-union-node";

interface TreeCanvasProps {
  persons: Person[];
  unions: Union[];
  unionChildren: UnionChildLink[];
  focusPersonId?: string;
  onPersonClick?: (personId: string) => void;
  onUnionClick?: (unionId: string) => void;
  maxGenerations?: number;
  searchHighlight?: string[];
  onAddSpouse?: (personId: string) => void;
  onAddChild?: (personId: string) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function TreeCanvas({
  persons,
  unions,
  unionChildren,
  focusPersonId,
  onPersonClick,
  onUnionClick,
  maxGenerations = 10,
  searchHighlight = [],
  onAddSpouse,
  onAddChild,
}: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [highlightSet] = useState(() => new Set(searchHighlight));

  const layout: TreeLayout = useMemo(
    () =>
      calculateTreeLayout(persons, unions, unionChildren, focusPersonId, {
        maxGenerations,
      }),
    [persons, unions, unionChildren, focusPersonId, maxGenerations]
  );

  const unionMap = useMemo(() => {
    const m = new Map<string, Union>();
    for (const u of unions) m.set(u.id, u);
    return m;
  }, [unions]);

  const personMap = useMemo(() => {
    const m = new Map<string, Person>();
    for (const p of persons) m.set(p.id, p);
    return m;
  }, [persons]);

  const childCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const uc of unionChildren) {
      m.set(uc.union_id, (m.get(uc.union_id) ?? 0) + 1);
    }
    return m;
  }, [unionChildren]);

  const unionsByPerson = useMemo(() => {
    const m = new Map<string, Union[]>();
    for (const u of unions) {
      const a = m.get(u.person_a_id) ?? [];
      a.push(u);
      m.set(u.person_a_id, a);
      const b = m.get(u.person_b_id) ?? [];
      b.push(u);
      m.set(u.person_b_id, b);
    }
    return m;
  }, [unions]);

  useEffect(() => {
    if (!focusPersonId) return;
    const node = layout.nodes.find(
      (n) => n.type === "person" && n.personId === focusPersonId
    );
    if (!node || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const targetZoom = Math.min(
      rect.width / (layout.width + 400),
      rect.height / (layout.height + 400),
      1.5
    );
    setZoom(Math.max(0.3, targetZoom));
    setPan({
      x: rect.width / 2 - node.x * targetZoom - 90,
      y: 80,
    });
  }, [focusPersonId, layout]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom((prev) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      const scale = next / prev;
      setPan((p) => ({
        x: mx - scale * (mx - p.x),
        y: my - scale * (my - p.y),
      }));
      return next;
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as SVGElement;
      if (target.closest(".tree-node")) return;
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "=" || e.key === "+") {
      setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
    } else if (e.key === "-") {
      setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
    } else if (e.key === "0") {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as SVGElement;
      const nodeEl = target.closest("[data-person-id]");
      if (nodeEl) {
        const personId = nodeEl.getAttribute("data-person-id");
        if (personId) {
          onPersonClick?.(personId);
        }
      }
    },
    [onPersonClick]
  );

  if (persons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">Aucune personne dans cet arbre</p>
          <p className="text-sm mt-1">
            Ajoutez des membres de la famille pour commencer
          </p>
        </div>
      </div>
    );
  }

  const svgWidth = Math.max(layout.width + 200, 800);
  const svgHeight = Math.max(layout.height + 200, 600);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-gray-50 dark:bg-gray-950 cursor-grab active:cursor-grabbing relative"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="select-none"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {layout.edges.map((edge, i) => (
            <EdgePath
              key={`edge-${i}`}
              edge={edge}
              nodes={layout.nodes}
            />
          ))}

          {layout.nodes.map((node) => {
            if (node.type === "person") {
              const person = personMap.get(node.personId ?? "") ?? (node.data as Person);
              const unionsForPerson = unionsByPerson.get(person.id) ?? [];
              const personChildren = childCountMap.get(person.id);
              const isHighlighted = highlightSet.has(person.id);
              const dimmed = highlightSet.size > 0 && !isHighlighted;

              return (
                <g key={node.id} data-person-id={person.id}>
                  <TreePersonNode
                    person={person}
                    x={node.x}
                    y={node.y}
                    isFocused={person.id === focusPersonId}
                    unions={unionsForPerson}
                    childrenCount={personChildren}
                    onClick={onPersonClick}
                    onAddSpouse={onAddSpouse}
                    onAddChild={onAddChild}
                    isHighlighted={isHighlighted}
                    dimmed={dimmed}
                  />
                </g>
              );
            }

            const union = unionMap.get(node.unionId ?? "") ?? (node.data as Union);
            const pA = personMap.get(union.person_a_id);
            const pB = personMap.get(union.person_b_id);
            const uc = childCountMap.get(union.id);

            return (
              <TreeUnionNode
                key={node.id}
                union={union}
                x={node.x}
                y={node.y}
                personA={
                  pA ? { first_name: pA.first_name, last_name: pA.last_name } : undefined
                }
                personB={
                  pB ? { first_name: pB.first_name, last_name: pB.last_name } : undefined
                }
                childrenCount={uc}
                onClick={onUnionClick}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

function EdgePath({
  edge,
  nodes,
}: {
  edge: LayoutEdge;
  nodes: LayoutNode[];
}) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);
  if (!fromNode || !toNode) return null;

  const x1 = fromNode.x + fromNode.width / 2;
  const y1 = fromNode.y + fromNode.height;
  const x2 = toNode.x + toNode.width / 2;
  const y2 = toNode.y;

  const midY = (y1 + y2) / 2;

  const strokeColor =
    edge.type === "parent_child"
      ? "#6B7280"
      : edge.type === "union_member"
      ? "#0B6E4F"
      : "#2563EB";

  return (
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none"
      stroke={strokeColor}
      strokeWidth={1.5}
      opacity={0.5}
    />
  );
}
