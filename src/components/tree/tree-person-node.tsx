"use client";

import type { Person } from "@/types";

interface TreePersonNodeProps {
  person: Person;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: () => void;
}

export function TreePersonNode(_props: TreePersonNodeProps) {
  return null;
}
