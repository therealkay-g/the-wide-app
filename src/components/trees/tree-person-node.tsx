"use client";

import { useId } from "react";
import type { Person, Union } from "@/types";
import {
  PERSON_NODE_WIDTH,
  PERSON_NODE_HEIGHT,
} from "@/lib/genealogy/tree-layout";

interface TreePersonNodeProps {
  person: Person;
  x: number;
  y: number;
  isFocused?: boolean;
  unions?: Union[]; // person's unions
  childrenCount?: number;
  onClick?: (personId: string) => void;
  onAddSpouse?: (personId: string) => void;
  onAddChild?: (personId: string) => void;
  /** Highlighted by search */
  isHighlighted?: boolean;
  /** Dimmed because another node matched the search */
  dimmed?: boolean;
  collapsed?: boolean;
}

const GENDER_COLORS: Record<string, string> = {
  male: "#2563EB",
  female: "#DB2777",
  other: "#6B7280",
  unknown: "#6B7280",
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

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export function TreePersonNode({
  person,
  x,
  y,
  isFocused,
  unions,
  childrenCount,
  onClick,
  onAddSpouse,
  onAddChild,
  isHighlighted,
  dimmed,
  collapsed,
}: TreePersonNodeProps) {
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const genderKey = person.gender ?? "unknown";
  const accent = GENDER_COLORS[genderKey] ?? GENDER_COLORS.unknown;

  const birthYear = getYear(person.birth_date);
  const deathYear = getYear(person.death_date);
  const dateDisplay = person.is_alive
    ? birthYear
      ? `né(e) en ${birthYear}`
      : null
    : [birthYear, deathYear].filter(Boolean).join(" – ") || "décédé(e)";

  const displayName =
    [person.first_name, person.last_name].filter(Boolean).join(" ") || "Inconnu";

  const initials =
    `${person.first_name?.charAt(0) ?? ""}${person.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
    "?";

  const unionCount = unions?.length ?? 0;

  const relationLabel =
    childrenCount && childrenCount > 0
      ? genderKey === "female"
        ? `Mère de ${childrenCount}`
        : genderKey === "male"
          ? `Père de ${childrenCount}`
          : `Parent de ${childrenCount}`
      : null;

  const avatarCx = x + 30;
  const avatarCy = y + 34;
  const avatarR = 20;

  const borderColor = !person.is_alive
    ? "#9CA3AF"
    : isFocused
      ? "#0B6E4F"
      : accent + "55";

  return (
    <g
      className={`tree-node ${dimmed ? "dimmed-node" : ""}`}
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(person.id);
      }}
    >
      <title>{displayName}</title>

      {/* Focus / highlight rings */}
      {isFocused && (
        <rect
          x={-5}
          y={-5}
          width={PERSON_NODE_WIDTH + 10}
          height={PERSON_NODE_HEIGHT + 10}
          rx={16}
          fill="none"
          stroke="#0B6E4F"
          strokeWidth={2}
          opacity={0.35}
        />
      )}
      {isHighlighted && (
        <rect
          x={-3}
          y={-3}
          width={PERSON_NODE_WIDTH + 6}
          height={PERSON_NODE_HEIGHT + 6}
          rx={14}
          fill="#FEF3C7"
          stroke="#F59E0B"
          strokeWidth={1.5}
          opacity={0.9}
        />
      )}

      {/* Card */}
      <rect
        width={PERSON_NODE_WIDTH}
        height={PERSON_NODE_HEIGHT}
        rx={12}
        fill={!person.is_alive ? "#F8FAFC" : "#FFFFFF"}
        stroke={borderColor}
        strokeWidth={isFocused ? 2.5 : 1.25}
      />

      {/* Gender accent bar */}
      <rect
        width={4.5}
        height={PERSON_NODE_HEIGHT - 20}
        x={2}
        y={10}
        rx={2.25}
        fill={accent}
        opacity={!person.is_alive ? 0.35 : 0.85}
      />

      {/* Avatar */}
      <circle
        cx={avatarCx}
        cy={avatarCy}
        r={avatarR + 1.5}
        fill={accent}
        opacity={0.12}
      />
      <clipPath id={`avatar-${clipId}`}>
        <circle cx={avatarCx} cy={avatarCy} r={avatarR} />
      </clipPath>
      <text
        x={avatarCx}
        y={avatarCy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={accent}
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
      {person.profile_photo && (
        <image
          href={person.profile_photo}
          x={avatarCx - avatarR}
          y={avatarCy - avatarR}
          width={avatarR * 2}
          height={avatarR * 2}
          clipPath={`url(#avatar-${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      )}
      {/* Deceased indicator */}
      {!person.is_alive && (
        <>
          <circle cx={avatarCx + avatarR - 3} cy={avatarCy + avatarR - 3} r={7} fill="#9CA3AF" />
          <text
            x={avatarCx + avatarR - 3}
            y={avatarCy + avatarR - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontWeight={700}
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            †
          </text>
        </>
      )}

      {/* Name */}
      <text
        x={x + 58}
        y={y + 26}
        fontSize={13}
        fontWeight={700}
        fill="#111827"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {truncate(displayName, 17)}
      </text>

      {/* Dates */}
      <text
        x={x + 58}
        y={y + 44}
        fontSize={10.5}
        fill="#6B7280"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: "none" }}
      >
        {truncate(dateDisplay ?? "", 22)}
      </text>

      {/* Gender + children count */}
      {relationLabel && (
        <text
          x={x + 58}
          y={y + 62}
          fontSize={10.5}
          fill={accent}
          fontWeight={500}
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {relationLabel}
        </text>
      )}

      {/* Profession */}
      {person.profession && (
        <text
          x={x + 58}
          y={relationLabel ? y + 78 : y + 62}
          fontSize={9.5}
          fill="#9CA3AF"
          fontStyle="italic"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {truncate(person.profession, 18)}
        </text>
      )}

      {/* Union indicators */}
      {unionCount > 0 && (
        <g style={{ pointerEvents: "none" }}>
          {Array.from({ length: Math.min(unionCount, 5) }).map((_, i) => (
            <circle
              key={i}
              cx={x + 62 + i * 13}
              cy={y + PERSON_NODE_HEIGHT - 14}
              r={4.5}
              fill="#D4A843"
            />
          ))}
          <text
            x={x + 66 + Math.min(unionCount, 5) * 13}
            y={y + PERSON_NODE_HEIGHT - 10}
            fontSize={9.5}
            fill="#92400E"
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >
            {unionCount === 1 ? "1 union" : `${unionCount} unions`}
          </text>
        </g>
      )}

      {/* Collapsed branches indicator */}
      {collapsed && (
        <g style={{ pointerEvents: "none" }}>
          <circle
            cx={x + PERSON_NODE_WIDTH / 2}
            cy={y + PERSON_NODE_HEIGHT + 1}
            r={9}
            fill="#0B6E4F"
          />
          <text
            x={x + PERSON_NODE_WIDTH / 2}
            y={y + PERSON_NODE_HEIGHT + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={700}
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            +
          </text>
        </g>
      )}

      {/* Hover background */}
      <rect
        className="node-hover-bg"
        width={PERSON_NODE_WIDTH}
        height={PERSON_NODE_HEIGHT}
        rx={12}
      />

      {/* Quick actions (visible on hover) */}
      {onAddSpouse && (
        <g
          className="node-action"
          transform={`translate(${PERSON_NODE_WIDTH + 2}, ${PERSON_NODE_HEIGHT / 2})`}
          onClick={(e) => {
            e.stopPropagation();
            onAddSpouse(person.id);
          }}
        >
          <title>Ajouter un conjoint</title>
          <circle r={10} fill="#0B6E4F" />
          <path
            d="M -5 0 H 5 M 0 -5 V 5"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
      {onAddChild && (
        <g
          className="node-action"
          transform={`translate(${PERSON_NODE_WIDTH / 2}, ${PERSON_NODE_HEIGHT + 2})`}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(person.id);
          }}
        >
          <title>Ajouter un enfant</title>
          <circle r={10} fill="#D4A843" />
          <path
            d="M -5 0 H 5 M 0 -5 V 5"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}
