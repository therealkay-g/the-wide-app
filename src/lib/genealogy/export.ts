import type { Person, Union, UnionChildLink } from "@/types";

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function fullName(p: Person | null | undefined): string {
  if (!p) return "Inconnu";
  return [p.first_name, p.middle_name, p.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function exportToJSON(
  treeName: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
) {
  const payload = {
    app: "WIDE",
    version: 1,
    exported_at: new Date().toISOString(),
    tree: treeName,
    persons,
    unions,
    union_children: unionChildren,
  };
  downloadFile(
    JSON.stringify(payload, null, 2),
    `${sanitize(treeName)}-wide.json`,
    "application/json"
  );
}

const CSV_HEADERS = [
  "id",
  "prenom",
  "postnom",
  "nom",
  "genre",
  "date_naissance",
  "date_deces",
  "vivant",
  "profession",
  "nationalite",
  "generation",
];

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",;\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCSV(persons: Person[], treeName: string) {
  const rows = [CSV_HEADERS.join(",")];
  for (const p of persons) {
    rows.push(
      [
        p.id,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.gender,
        p.birth_date,
        p.death_date,
        p.is_alive ? "oui" : "non",
        p.profession,
        p.nationality,
        p.generation,
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  downloadFile(
    "\uFEFF" + rows.join("\n"),
    `${sanitize(treeName)}-wide.csv`,
    "text/csv;charset=utf-8"
  );
}

function gedcomDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function escapeGedcom(value: string): string {
  return value.replace(/@/g, "@@");
}

/** GEDCOM 5.5.1 export built from unions (polygamy-safe: one FAM per union). */
export function exportToGEDCOM(
  treeName: string,
  persons: Person[],
  unions: Union[],
  unionChildren: UnionChildLink[]
) {
  const lines: string[] = [];
  const indiIds = new Map<string, string>();

  persons.forEach((p, i) => indiIds.set(p.id, `@I${i + 1}@`));
  const famIds = new Map<string, string>();
  unions.forEach((u, i) => famIds.set(u.id, `@F${i + 1}@`));

  const childrenByUnion = new Map<string, string[]>();
  for (const link of unionChildren) {
    const list = childrenByUnion.get(link.union_id) ?? [];
    if (!list.includes(link.person_id)) list.push(link.person_id);
    childrenByUnion.set(link.union_id, list);
  }

  lines.push("0 HEAD");
  lines.push("1 SOUR WIDE");
  lines.push("2 NAME WIDE Genealogy");
  lines.push("2 VERS 1.0");
  lines.push("1 GEDC");
  lines.push("2 VERS 5.5.1");
  lines.push("2 FORM LINEAGE-LINKED");
  lines.push("1 CHAR UTF-8");
  lines.push(`1 NOTE Arbre: ${escapeGedcom(treeName).slice(0, 200)}`);

  for (const person of persons) {
    const id = indiIds.get(person.id)!;
    lines.push(`0 ${id} INDI`);
    const name = fullName(person);
    lines.push(`1 NAME ${escapeGedcom(name)}`);
    if (person.last_name) {
      lines.push(`2 GIVN ${escapeGedcom([person.first_name, person.middle_name].filter(Boolean).join(" "))}`);
      lines.push(`2 SURN ${escapeGedcom(person.last_name)}`);
    }
    if (person.gender === "male") lines.push("1 SEX M");
    else if (person.gender === "female") lines.push("1 SEX F");

    if (person.birth_date) {
      lines.push("1 BIRT");
      const gd = gedcomDate(person.birth_date);
      if (gd) lines.push(`2 DATE ${gd}`);
    }
    if (person.death_date) {
      lines.push("1 DEAT");
      const gd = gedcomDate(person.death_date);
      if (gd) lines.push(`2 DATE ${gd}`);
    }

    for (const u of unions) {
      if (u.person_a_id !== person.id && u.person_b_id !== person.id) continue;
      const fid = famIds.get(u.id)!;
      lines.push(`1 FAMS ${fid}`);
    }
    for (const link of unionChildren) {
      if (link.person_id === person.id) {
        lines.push(`1 FAMC ${famIds.get(link.union_id)!}`);
      }
    }
  }

  for (const union of unions) {
    const fid = famIds.get(union.id)!;
    lines.push(`0 ${fid} FAM`);
    lines.push(`1 HUSB ${indiIds.get(union.person_a_id) ?? ""}`.trimEnd());
    lines.push(`1 WIFE ${indiIds.get(union.person_b_id) ?? ""}`.trimEnd());
    lines.push(`1 MARR`);
    if (union.start_date) {
      const gd = gedcomDate(union.start_date);
      if (gd) lines.push(`2 DATE ${gd}`);
    }
    for (const childId of childrenByUnion.get(union.id) ?? []) {
      const cid = indiIds.get(childId);
      if (cid) lines.push(`1 CHIL ${cid}`);
    }
  }

  lines.push("0 TRLR");
  downloadFile(
    lines.join("\r\n"),
    `${sanitize(treeName)}.ged`,
    "text/plain;charset=utf-8"
  );
}

function sanitize(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "arbre"
  );
}
