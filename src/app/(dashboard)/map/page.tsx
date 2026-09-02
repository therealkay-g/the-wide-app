"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { getPlaces, deletePlace } from "@/services/places";
import { AfricaMap } from "@/components/map/africa-map";
import { PlaceList } from "@/components/map/place-list";
import { PlaceForm } from "@/components/map/place-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import type { Place } from "@/types";

export default function MapPage() {
  const { user, loading: userLoading } = useUser();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<Place | null>(null);

  const fetchPlaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data: memberFamilies } = await supabase
      .from("family_members")
      .select("family_id")
      .eq("user_id", user.id)
      .limit(1);

    if (!memberFamilies?.length) {
      setPlaces([]);
      setLoading(false);
      return;
    }

    const result = await getPlaces(memberFamilies[0].family_id);
    if (result.error) setError(result.error);
    setPlaces(result.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleSelectFromList = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleEdit = () => {
    if (selectedPlace) {
      setEditingPlace(selectedPlace);
      setFormOpen(true);
    }
  };

  const handleNewPlace = () => {
    setEditingPlace(undefined);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const result = await deletePlace(deleteConfirm.id);
    if (result.error) {
      setError(result.error);
    } else {
      if (selectedPlace?.id === deleteConfirm.id) setSelectedPlace(null);
      await fetchPlaces();
    }
    setDeleteConfirm(null);
  };

  const handleFormSaved = async () => {
    await fetchPlaces();
    setEditingPlace(undefined);
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Carte familiale
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {places.length} lieu{places.length !== 1 ? "x" : ""}
          </p>
        </div>
        <Button onClick={handleNewPlace}>
          <Plus className="h-4 w-4" />
          Ajouter un lieu
        </Button>
      </div>

      <ErrorMessage message={error} />

      {places.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<MapPin className="h-12 w-12" />}
              title="Aucun lieu"
              description="Ajoutez des lieux pour visualiser les origines et migrations de votre famille sur la carte."
              action={
                <Button onClick={handleNewPlace}>
                  <Plus className="h-4 w-4" />
                  Ajouter un lieu
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <AfricaMap
                places={places}
                onPlaceClick={handlePlaceClick}
                selectedPlaceId={selectedPlace?.id}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Lieux
                </CardTitle>
                <span className="text-xs text-gray-400">{places.length}</span>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0 max-h-[500px]">
                <PlaceList
                  places={places}
                  selectedPlaceId={selectedPlace?.id}
                  onSelect={handleSelectFromList}
                />
              </CardContent>
            </Card>

            {selectedPlace && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{selectedPlace.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedPlace.country && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Pays :</span> {selectedPlace.country}
                    </p>
                  )}
                  {selectedPlace.province && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Province :</span> {selectedPlace.province}
                    </p>
                  )}
                  {selectedPlace.city && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Ville :</span> {selectedPlace.city}
                    </p>
                  )}
                  {selectedPlace.territory && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Territoire :</span> {selectedPlace.territory}
                    </p>
                  )}
                  {selectedPlace.chiefdom && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Chefferie :</span> {selectedPlace.chiefdom}
                    </p>
                  )}
                  {selectedPlace.groupement && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Groupement :</span> {selectedPlace.groupement}
                    </p>
                  )}
                  {selectedPlace.village && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Village :</span> {selectedPlace.village}
                    </p>
                  )}
                  {selectedPlace.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {selectedPlace.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Pencil className="h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(selectedPlace)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {user && (
        <PlaceForm
          place={editingPlace}
          ownerId={user.id}
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingPlace(undefined);
          }}
          onSaved={handleFormSaved}
        />
      )}

      <ConfirmationDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer le lieu"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirm?.name}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </div>
  );
}
