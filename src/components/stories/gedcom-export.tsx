"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { getPersons } from "@/services/persons";
import { getRelationships } from "@/services/relationships";
import { generateGedcom } from "@/lib/genealogy/gedcom";
import { Download, FileText, Users } from "lucide-react";

interface GedcomExportProps {
  treeId: string;
}

export function GedcomExport({ treeId }: GedcomExportProps) {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [counts, setCounts] = useState<{ persons: number; relationships: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setExported(false);

    try {
      const [personsResult, relsResult] = await Promise.all([
        getPersons(treeId, { pageSize: 1000 }),
        getRelationships(treeId),
      ]);

      if (personsResult.error) {
        setError(personsResult.error);
        setLoading(false);
        return;
      }

      setCounts({
        persons: personsResult.data.length,
        relationships: relsResult.data.length,
      });

      const gedcomContent = generateGedcom(personsResult.data, relsResult.data);

      const blob = new Blob([gedcomContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arbre_${treeId.slice(0, 8)}.ged`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExported(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ErrorMessage message={error} />

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Exportez votre arbre généalogique au format GEDCOM, le format standard pour les données généalogiques.
          </p>

          {counts && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0B6E4F]" />
                <span className="text-gray-600 dark:text-gray-300">
                  {counts.persons} individu{counts.persons !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0B6E4F]" />
                <span className="text-gray-600 dark:text-gray-300">
                  {counts.relationships} relation{counts.relationships !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleExport} loading={loading}>
              <Download className="h-4 w-4" />
              Exporter en GEDCOM
            </Button>
            {exported && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Fichier téléchargé !
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
