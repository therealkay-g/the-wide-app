import type { Person, Relationship, RelationshipType } from "@/types";

export interface PersonData {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  sex: "M" | "F" | "U";
  birthDate: string | null;
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  fams: string[];
  famc: string[];
}

export interface FamilyData {
  id: string;
  husband: string | null;
  wife: string | null;
  children: string[];
}

export interface ParseResult {
  persons: PersonData[];
  families: FamilyData[];
  errors: string[];
}

function parseName(nameField: string): { firstName: string; lastName: string } {
  const slashMatch = nameField.match(/^\/(.+?)\//);
  const lastName = slashMatch ? slashMatch[1].trim() : "";
  const firstName = nameField
    .replace(/\/[^/]+\//g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { firstName, lastName };
}

export function parseGedcom(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const persons: PersonData[] = [];
  const families: FamilyData[] = [];
  const errors: string[] = [];

  let currentType: "INDI" | "FAM" | null = null;
  let currentId = "";
  let currentPerson: Partial<PersonData> | null = null;
  let currentFamily: Partial<FamilyData> | null = null;
  let currentSubTag = "";
  let inBirt = false;
  let inDeat = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^(\d+)\s+(@[^@]+@)?\s*(\w+)\s*(.*)?$/);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const id = match[2] || "";
    const tag = match[3];
    const value = (match[4] || "").trim();

    if (level === 0) {
      inBirt = false;
      inDeat = false;

      if (currentPerson && currentId) {
        persons.push({
          id: currentId,
          name: currentPerson.name || "",
          firstName: currentPerson.firstName || "",
          lastName: currentPerson.lastName || "",
          sex: currentPerson.sex || "U",
          birthDate: currentPerson.birthDate || null,
          birthPlace: currentPerson.birthPlace || null,
          deathDate: currentPerson.deathDate || null,
          deathPlace: currentPerson.deathPlace || null,
          fams: currentPerson.fams || [],
          famc: currentPerson.famc || [],
        });
      }
      if (currentFamily && currentId) {
        families.push({
          id: currentId,
          husband: currentFamily.husband || null,
          wife: currentFamily.wife || null,
          children: currentFamily.children || [],
        });
      }

      if (tag === "INDI") {
        currentType = "INDI";
        currentId = id;
        currentPerson = { fams: [], famc: [] };
      } else if (tag === "FAM") {
        currentType = "FAM";
        currentId = id;
        currentFamily = { children: [] };
      } else {
        currentType = null;
        currentId = "";
        currentPerson = null;
        currentFamily = null;
      }
      continue;
    }

    if (currentType === "INDI" && currentPerson) {
      if (level === 1) {
        inBirt = tag === "BIRT";
        inDeat = tag === "DEAT";
        currentSubTag = tag;

        switch (tag) {
          case "NAME":
            currentPerson.name = value;
            const { firstName, lastName } = parseName(value);
            currentPerson.firstName = firstName;
            currentPerson.lastName = lastName;
            break;
          case "SEX":
            currentPerson.sex = value === "M" ? "M" : value === "F" ? "F" : "U";
            break;
          case "FAMS":
            currentPerson.fams = [...(currentPerson.fams || []), value];
            break;
          case "FAMC":
            currentPerson.famc = [...(currentPerson.famc || []), value];
            break;
        }
      } else if (level === 2) {
        if (inBirt) {
          if (tag === "DATE") currentPerson.birthDate = value;
          if (tag === "PLAC") currentPerson.birthPlace = value;
        }
        if (inDeat) {
          if (tag === "DATE") currentPerson.deathDate = value;
          if (tag === "PLAC") currentPerson.deathPlace = value;
        }
      }
    }

    if (currentType === "FAM" && currentFamily) {
      if (level === 1) {
        switch (tag) {
          case "HUSB":
            currentFamily.husband = value;
            break;
          case "WIFE":
            currentFamily.wife = value;
            break;
          case "CHIL":
            currentFamily.children = [...(currentFamily.children || []), value];
            break;
        }
      }
    }
  }

  if (currentPerson && currentId) {
    persons.push({
      id: currentId,
      name: currentPerson.name || "",
      firstName: currentPerson.firstName || "",
      lastName: currentPerson.lastName || "",
      sex: currentPerson.sex || "U",
      birthDate: currentPerson.birthDate || null,
      birthPlace: currentPerson.birthPlace || null,
      deathDate: currentPerson.deathDate || null,
      deathPlace: currentPerson.deathPlace || null,
      fams: currentPerson.fams || [],
      famc: currentPerson.famc || [],
    });
  }
  if (currentFamily && currentId) {
    families.push({
      id: currentId,
      husband: currentFamily.husband || null,
      wife: currentFamily.wife || null,
      children: currentFamily.children || [],
    });
  }

  if (persons.length === 0 && families.length === 0) {
    errors.push("Aucun individu ou famille trouvé dans le fichier GEDCOM");
  }

  return { persons, families, errors };
}

function formatGedDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function escapeGedcom(value: string): string {
  return value.replace(/@/g, "@@");
}

export function generateGedcom(
  persons: Person[],
  relationships: Relationship[]
): string {
  const lines: string[] = [];
  const personIdMap = new Map<string, string>();
  let nextId = 1;

  const getIndiId = (personId: string): string => {
    if (personIdMap.has(personId)) return personIdMap.get(personId)!;
    const id = `@I${nextId}@`;
    personIdMap.set(personId, id);
    nextId++;
    return id;
  };

  const buildFamMap = (): Map<string, { husband: string; wife: string; children: string[] }> => {
    const famMap = new Map<string, { husband: string; wife: string; children: string[] }>();
    const spouseRels = relationships.filter(
      (r) => r.relationship_type === "SPOUSE" || r.relationship_type === "FORMER_SPOUSE"
    );
    const parentChildRels = relationships.filter(
      (r) =>
        r.relationship_type === "BIOLOGICAL_PARENT" ||
        r.relationship_type === "ADOPTIVE_PARENT" ||
        r.relationship_type === "STEP_PARENT"
    );

    for (const rel of spouseRels) {
      const famKey = [rel.person_id, rel.related_person_id].sort().join("-");
      if (!famMap.has(famKey)) {
        famMap.set(famKey, {
          husband: rel.person_id,
          wife: rel.related_person_id,
          children: [],
        });
      }
    }

    for (const rel of parentChildRels) {
      const parentId = rel.person_id;
      const childId = rel.related_person_id;

      let foundFam = false;
      for (const [, fam] of famMap) {
        if (fam.husband === parentId || fam.wife === parentId) {
          fam.children.push(childId);
          foundFam = true;
          break;
        }
      }

      if (!foundFam) {
        const famKey = `${parentId}-fam`;
        if (!famMap.has(famKey)) {
          famMap.set(famKey, {
            husband: parentId,
            wife: "",
            children: [childId],
          });
        } else {
          famMap.get(famKey)!.children.push(childId);
        }
      }
    }

    return famMap;
  };

  const famMap = buildFamMap();
  const personFamMap = new Map<string, string[]>();
  const childFamMap = new Map<string, string[]>();

  let famIdx = 1;
  const famIdMap = new Map<string, string>();
  for (const [key] of famMap) {
    const id = `@F${famIdx}@`;
    famIdMap.set(key, id);
    famIdx++;

    const fam = famMap.get(key)!;
    const members = [fam.husband, fam.wife, ...fam.children].filter(Boolean);
    for (const m of members) {
      if (fam.husband === m || fam.wife === m) {
        const existing = personFamMap.get(m) || [];
        existing.push(id);
        personFamMap.set(m, existing);
      }
      if (fam.children.includes(m)) {
        const existing = childFamMap.get(m) || [];
        existing.push(id);
        childFamMap.set(m, existing);
      }
    }
  }

  for (const p of persons) {
    getIndiId(p.id);
  }

  lines.push("0 HEAD");
  lines.push("1 SOUR WIDE");
  lines.push("2 VERS 1.0");
  lines.push("1 GEDC");
  lines.push("2 VERS 5.5.1");
  lines.push("2 FORM LINEAGE-LINKED");
  lines.push("1 CHAR UTF-8");

  for (const person of persons) {
    const indiId = getIndiId(person.id);
    lines.push(`0 ${indiId} INDI`);

    const name = [
      person.first_name || "",
      person.middle_name || "",
      person.last_name || "",
    ]
      .filter(Boolean)
      .join(" ");
    if (name) {
      lines.push(`1 NAME ${escapeGedcom(name)}`);
      if (person.last_name) {
        lines.push(`2 GIVN ${person.first_name || ""}`.trim());
        lines.push(`2 SURN ${person.last_name}`);
      }
    }

    if (person.gender) {
      const sex =
        person.gender === "male" ? "M" : person.gender === "female" ? "F" : "U";
      lines.push(`1 SEX ${sex}`);
    }

    if (person.birth_date) {
      lines.push("1 BIRT");
      const formatted = formatGedDate(person.birth_date);
      if (formatted) lines.push(`2 DATE ${formatted}`);
    }

    if (person.death_date) {
      lines.push("1 DEAT");
      const formatted = formatGedDate(person.death_date);
      if (formatted) lines.push(`2 DATE ${formatted}`);
    }

    const fams = personFamMap.get(person.id);
    if (fams) {
      for (const f of fams) {
        lines.push(`1 FAMS ${f}`);
      }
    }

    const famc = childFamMap.get(person.id);
    if (famc) {
      for (const f of famc) {
        lines.push(`1 FAMC ${f}`);
      }
    }
  }

  for (const [key, fam] of famMap) {
    const famId = famIdMap.get(key);
    if (!famId) continue;
    lines.push(`0 ${famId} FAM`);
    if (fam.husband && personIdMap.has(fam.husband)) {
      lines.push(`1 HUSB ${personIdMap.get(fam.husband)}`);
    }
    if (fam.wife && personIdMap.has(fam.wife)) {
      lines.push(`1 WIFE ${personIdMap.get(fam.wife)}`);
    }
    for (const child of fam.children) {
      if (personIdMap.has(child)) {
        lines.push(`1 CHIL ${personIdMap.get(child)}`);
      }
    }
  }

  lines.push("0 TRLR");
  return lines.join("\r\n");
}
