"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { parseGedcom } from "@/lib/genealogy/gedcom";
import { createPerson } from "@/services/persons";
import { createRelationship } from "@/services/relationships";
import { Upload, AlertCircle, CheckCircle2, FileText, Users } from "lucide-react";
import type { Person, Relationship, RelationshipType } from "@/types";

interface GedcomImportProps {
  treeId: string;
  userId: string;
  familyId?: string;
  onImported: () => void;
}

export function GedcomImport({ treeId, userId, familyId, onImported }: GedcomImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parseGedcom> | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".ged")) {
      setError("Veuillez sélectionner un fichier .ged");
      return;
    }

    setFile(selected);
    setError(null);
    setParsed(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const result = parseGedcom(content);
      setParsed(result);
    };
    reader.readAsText(selected);
  };

  const handleImport = async () => {
    if (!parsed || !treeId) return;

    setImporting(true);
    setError(null);
    setImportResult(null);

    const totalSteps = parsed.persons.length + parsed.families.length;
    let currentStep = 0;
    let successCount = 0;
    const errors: string[] = [];

    const idMap = new Map<string, string>();

    for (const p of parsed.persons) {
      setProgress({
        current: currentStep,
        total: totalSteps,
        label: `Import de ${p.firstName || p.lastName || "Personne"}`,
      });

      const result = await createPerson({
        tree_id: treeId,
        family_id: familyId ?? "",
        created_by: userId,
        first_name: p.firstName || null,
        middle_name: null,
        last_name: p.lastName || null,
        post_name: null,
        nickname: null,
        traditional_name: null,
        gender: p.sex === "M" ? "male" : p.sex === "F" ? "female" : "unknown",
        profile_photo: null,
        birth_date: p.birthDate || null,
        birth_date_precision: "UNKNOWN",
        birth_place_id: null,
        death_date: p.deathDate || null,
        death_date_precision: "UNKNOWN",
        death_place_id: null,
        burial_place_id: null,
        country: null,
        province: null,
        city: null,
        territory: null,
        sector: null,
        chiefdom: null,
        groupement: null,
        village: null,
        clan: null,
        lineage: null,
        family_origin: null,
        certainty: "UNKNOWN",
        notes: null,
        profession: null,
        nationality: null,
        biography: null,
        phone: null,
        email: null,
        marital_status: "UNKNOWN",
        is_alive: true,
        adoption_type: "UNKNOWN",
        generation: 0,
      });

      if (result.error) {
        errors.push(`Erreur pour ${p.firstName} ${p.lastName}: ${result.error}`);
      } else if (result.data) {
        idMap.set(p.id, result.data.id);
        successCount++;
      }

      currentStep++;
    }

    for (const fam of parsed.families) {
      setProgress({
        current: currentStep,
        total: totalSteps,
        label: `Import de la famille ${fam.id}`,
      });

      const relTypeMapping: { parentType: RelationshipType; childType: RelationshipType } = {
        parentType: "BIOLOGICAL_PARENT",
        childType: "BIOLOGICAL_PARENT",
      };

      const husbId = fam.husband ? idMap.get(fam.husband) : null;
      const wifeId = fam.wife ? idMap.get(fam.wife) : null;

      if (husbId && wifeId) {
        const relResult = await createRelationship({
          person_id: husbId,
          related_person_id: wifeId,
          relationship_type: "SPOUSE",
          certainty: "UNKNOWN",
          union_id: null,
          notes: null,
          created_by: userId,
          updated_at: new Date().toISOString(),
        });
        if (relResult.error) {
          errors.push(`Erreur relation couple: ${relResult.error}`);
        }
      }

      for (const childId of fam.children) {
        const mappedChildId = idMap.get(childId);
        const parentId = husbId || wifeId;

        if (mappedChildId && parentId) {
          const relResult = await createRelationship({
            person_id: parentId,
            related_person_id: mappedChildId,
            relationship_type: relTypeMapping.parentType,
            certainty: "UNKNOWN",
            notes: null,
            union_id: null,
            created_by: userId,
            updated_at: new Date().toISOString(),
          });
          if (relResult.error) {
            errors.push(`Erreur relation parent-enfant: ${relResult.error}`);
          }
        }
      }

      currentStep++;
    }

    setProgress({ current: totalSteps, total: totalSteps, label: "Terminé" });
    setImportResult({ success: successCount, errors });
    setImporting(false);

    if (successCount > 0) {
      onImported();
    }
  };

  const reset = () => {
    setFile(null);
    setParsed(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ged"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Choisir un fichier .ged
        </Button>
        {file && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4" />
            {file.name}
            <button onClick={reset} className="text-red-500 hover:text-red-700 text-xs">
              Retirer
            </button>
          </div>
        )}
      </div>

      <ErrorMessage message={error} />

      {parsed && !importResult && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Aperçu de l&apos;importation
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0B6E4F]" />
                <span className="text-gray-600 dark:text-gray-300">
                  {parsed.persons.length} individu{parsed.persons.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0B6E4F]" />
                <span className="text-gray-600 dark:text-gray-300">
                  {parsed.families.length} famille{parsed.families.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {parsed.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-600">Avertissements :</p>
                {parsed.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-600 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            <Button
              onClick={handleImport}
              loading={importing}
              disabled={parsed.persons.length === 0}
            >
              Importer {parsed.persons.length} individu{parsed.persons.length !== 1 ? "s" : ""}
            </Button>
          </CardContent>
        </Card>
      )}

      {importing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{progress.label}</span>
            <span>
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#0B6E4F] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {importResult && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                {importResult.success} individu{importResult.success !== 1 ? "s" : ""} importé{importResult.success !== 1 ? "s" : ""}
              </span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-500 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              Importer un autre fichier
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
