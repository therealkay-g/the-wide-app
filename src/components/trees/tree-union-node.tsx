"use client";

import type { Union } from "@/types";
import {
  UNION_NODE_WIDTH,
  UNION_NODE_HEIGHT,
} from "@/lib/genealogy/tree-layout";

interface TreeUnionNodeProps {
  union: Union;
  x: number;
  y: number;
  personA?: { first_name: string | null; last_name: string | null };
  personB?: { first_name: string | null; last_name: string | null };
  childrenCount?: number;
  onClick?: (unionId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#16A34A",
  SEPARATED: "#D97706",
  DIVORCED: "#DC2626",
  WIDOWED: "#7C3AED",
  DISSOLVED: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "active",
  SEPARATED: "séparé",
  DIVORCED: "divorcé",
  WIDOWED: "veuf",
  DISSOLVED: "dissous",
};

const TYPE_LABELS: Record<string, string> = {
  MARRIAGE: "Mariage",
  TRADITIONAL_MARRIAGE: "Mariage traditionnel",
  CIVIL_MARRIAGE: "Mariage civil",
  RELIGIOUS_MARRIAGE: "Mariage religieux",
  FREE_UNION: "Union libre",
  CONCUBINAGE: "Concubinage",
  SEPARATION: "Séparation",
  DIVORCE: "Divorce",
  WIDOWHOOD: "Veuvage",
  OTHER: "Autre",
};

function getYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : year.toString();
  } catch {
    return null;
  }
}

export function TreeUnionNode({
  union,
  x,
  y,
  personA,
  personB,
  childrenCount,
  onClick,
}: TreeUnionNodeProps) {
  const statusColor =
    STATUS_COLORS[union.status] ?? STATUS_COLORS.DISSOLVED;
  const cx = x + UNION_NODE_WIDTH / 2;
  const cy = y + UNION_NODE_HEIGHT / 2;
  const r = UNION_NODE_WIDTH / 2 - 4;

  const startYear = getYear(union.start_date);
  const endYear = getYear(union.end_date);
  const yearLabel =
    union.status === "ACTIVE" && startYear
      ? `${startYear} – `
      : [startYear, endYear].filter(Boolean).join("–") || "";

  const tooltip = [
    `${TYPE_LABELS[union.union_type] ?? "Union"} ${
      STATUS_LABELS[union.status] ?? ""
    }`.trim(),
    [personA?.first_name, personA?.last_name].filter(Boolean).join(" "),
    [personB?.first_name, personB?.last_name].filter(Boolean).join(" "),
    childrenCount
      ? `${childrenCount} ${childrenCount === 1 ? "enfant" : "enfants"}`
      : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <g
      className="tree-node"
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(union.id);
      }}
    >
      <title>{tooltip}</title>

      {/* Diamond shape */}
      <g transform={`translate(${cx}, ${cy}) rotate(45)`}>
        <rect
          x={-r}
          y={-r}
          width={r * 2}
          height={r * 2}
          rx={5}
          fill="#FFFFFF"
          stroke={statusColor}
          strokeWidth={2}
        />
        <rect
          x={-r + 4}
          y={-r + 4}
          width={r * 2 - 8}
          height={r * 2 - 8}
          rx={3}
          fill={statusColor}
          opacity={0.15}
        />
      </g>

      {/* Heart glyph */}
      <path
        d={`M ${cx} ${cy + 3.2}
            C ${cx - 5} ${cy - 1}, ${cx - 3.4} ${cy - 5.4}, ${cx} ${cy - 2.4}
            C ${cx + 3.4} ${cy - 5.4}, ${cx + 5} ${cy - 1}, ${cx} ${cy + 3.2} Z`}
        fill={statusColor}
        style={{ pointerEvents: "none" }}
      />

      {/* Children count badge */}
      {childrenCount !== undefined && childrenCount > 0 && (
        <g style={{ pointerEvents: "none" }}>
          <circle cx={cx + r - 2} cy={cy - r + 2} r={7.5} fill="#0B6E4F" />
          <text
            x={cx + r - 2}
            y={cy - r + 3}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            {childrenCount > 99 ? "99+" : childrenCount}
          </text>
        </g>
      )}

      {/* Labels below the diamond */}
      <text
        x={cx}
        y={y + UNION_NODE_HEIGHT + 12}
        textAnchor="middle"
        fontSize={8.5}
        fontWeight={600}
        fill="#374151"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {(TYPE_LABELS[union.union_type] ?? "Union").slice(0, 22)}
      </text>
      {yearLabel && (
        <text
          x={cx}
          y={y + UNION_NODE_HEIGHT + 23}
          textAnchor="middle"
          fontSize={8}
          fill="#9CA3AF"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {yearLabel}
        </text>
      )}
    </g>
  );
}
