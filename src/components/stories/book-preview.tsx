"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { Family, Person, Event, Story } from "@/types";

interface BookConfig {
  includePhotos: boolean;
  includeDocuments: boolean;
  includeChronology: boolean;
  includeStories: boolean;
}

interface BookPreviewProps {
  family: Family | null;
  persons: Person[];
  events: Event[];
  stories: Story[];
  config: BookConfig;
}

export function BookPreview({ family, persons, events, stories, config }: BookPreviewProps) {
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const personWithLifeDates = (p: Person) => {
    const parts: string[] = [];
    if (p.first_name || p.last_name) {
      parts.push(`${p.first_name || ""} ${p.last_name || ""}`.trim());
    }
    if (p.birth_date) {
      parts.push(`* ${p.birth_date}`);
    }
    if (p.death_date) {
      parts.push(`† ${p.death_date}`);
    }
    if (p.country) {
      parts.push(`(${p.country})`);
    }
    return parts.join(" ");
  };

  const handleExportPdf = () => {
    alert("L'export PDF sera implémenté prochainement.");
  };

  const publishedStories = stories.filter((s) => s.visibility !== "private");
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.date_value) return 1;
    if (!b.date_value) return -1;
    return a.date_value.localeCompare(b.date_value);
  });

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Aperçu du livre
        </span>
        <Button variant="outline" size="sm" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4" />
          Exporter en PDF
        </Button>
      </div>

      <div className="p-8 md:p-12 space-y-16">
        {/* Page de couverture */}
        <div className="text-center py-12 border-b border-gray-200 dark:border-gray-700">
          <div className="inline-block mb-8">
            <div className="h-1 w-24 bg-[#0B6E4F] mx-auto mb-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {family?.name || "Arbre généalogique"}
          </h1>
          {family?.description && (
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              {family.description}
            </p>
          )}
          <div className="text-sm text-gray-400 dark:text-gray-500 mt-8">
            <p>Généré le {today}</p>
            <p className="mt-1">{persons.length} membre{persons.length !== 1 ? "s" : ""} de la famille</p>
          </div>
          <div className="inline-block mt-8">
            <div className="h-1 w-24 bg-[#0B6E4F] mx-auto" />
          </div>
        </div>

        {/* Table des matières */}
        <div className="py-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Table des matières
          </h2>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <span className="font-medium">1.</span> Histoire de la famille
              <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 mx-2" />
              <span className="text-sm text-gray-400">3</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-medium">2.</span> Membres de la famille
              <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 mx-2" />
              <span className="text-sm text-gray-400">4</span>
            </li>
            {config.includeChronology && sortedEvents.length > 0 && (
              <li className="flex items-center gap-2">
                <span className="font-medium">3.</span> Chronologie
                <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 mx-2" />
                <span className="text-sm text-gray-400">—</span>
              </li>
            )}
            {config.includeStories && publishedStories.length > 0 && (
              <li className="flex items-center gap-2">
                <span className="font-medium">{config.includeChronology && sortedEvents.length > 0 ? "4" : "3"}.</span> Histoires
                <span className="flex-1 border-b border-dotted border-gray-300 dark:border-gray-600 mx-2" />
                <span className="text-sm text-gray-400">—</span>
              </li>
            )}
          </ul>
        </div>

        {/* Chapitre: Histoire de la famille */}
        <div className="py-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            1. Histoire de la famille
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {family?.description ? (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {family.description}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                Ajoutez une description à votre famille pour enrichir cette section.
              </p>
            )}
          </div>
        </div>

        {/* Chapitre: Membres de la famille */}
        <div className="py-8 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            2. Membres de la famille
          </h2>
          {persons.length === 0 ? (
            <p className="text-gray-400 italic">
              Aucun membre de la famille à inclure.
            </p>
          ) : (
            <div className="space-y-6">
              {persons.map((person) => (
                <div
                  key={person.id}
                  className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {personWithLifeDates(person)}
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                    {person.gender && (
                      <p>
                        <span className="font-medium">Sexe :</span>{" "}
                        {person.gender === "male" ? "Masculin" : person.gender === "female" ? "Féminin" : "Autre"}
                      </p>
                    )}
                    {person.country && (
                      <p>
                        <span className="font-medium">Pays :</span> {person.country}
                      </p>
                    )}
                    {person.city && (
                      <p>
                        <span className="font-medium">Ville :</span> {person.city}
                      </p>
                    )}
                    {person.clan && (
                      <p>
                        <span className="font-medium">Clan :</span> {person.clan}
                      </p>
                    )}
                  </div>
                  {person.notes && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                      {person.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chapitre: Chronologie */}
        {config.includeChronology && (
          <div className="py-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              3. Chronologie
            </h2>
            {sortedEvents.length === 0 ? (
              <p className="text-gray-400 italic">
                Aucun événement dans la chronologie.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 py-2"
                  >
                    <span className="text-sm font-mono text-gray-400 dark:text-gray-500 w-24 shrink-0">
                      {event.date_value || "Date inconnue"}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {event.event_type}
                      </span>
                      {event.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chapitre: Histoires */}
        {config.includeStories && publishedStories.length > 0 && (
          <div className="py-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {config.includeChronology && sortedEvents.length > 0 ? "4" : "3"}. Histoires
            </h2>
            <div className="space-y-8">
              {publishedStories.map((story) => (
                <div key={story.id}>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {story.title}
                  </h3>
                  {story.content && (
                    <p className="text-gray-700 dark:text-gray-300 italic mb-4">
                      {story.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fin */}
        <div className="text-center py-8">
          <div className="h-1 w-24 bg-[#0B6E4F] mx-auto mb-6" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Document généré par WIDE — {today}
          </p>
        </div>
      </div>
    </div>
  );
}
