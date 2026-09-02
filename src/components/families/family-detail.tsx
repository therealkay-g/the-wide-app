"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingPage } from "@/components/ui/status";
import { useUser } from "@/hooks/use-user";
import {
  getFamily,
  getFamilyMembers,
  deleteFamily,
} from "@/services/families";
import { InviteMemberDialog } from "./invite-member-dialog";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Lock,
  Eye,
  Globe,
} from "lucide-react";
import type { Family, FamilyMember, Profile, Visibility, FamilyRole } from "@/types";

interface FamilyMemberWithProfile extends FamilyMember {
  profiles: Profile;
}

const privacyConfig: Record<
  Visibility,
  { label: string; icon: React.ReactNode; variant: "outline" | "secondary" | "info" }
> = {
  private: { label: "Privée", icon: <Lock className="h-3 w-3" />, variant: "outline" },
  family: { label: "Famille", icon: <Eye className="h-3 w-3" />, variant: "secondary" },
  public: { label: "Publique", icon: <Globe className="h-3 w-3" />, variant: "info" },
};

const roleLabels: Record<FamilyRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  CONTRIBUTOR: "Contributeur",
  VIEWER: "Observateur",
};

interface FamilyDetailProps {
  familyId: string;
}

export function FamilyDetail({ familyId }: FamilyDetailProps) {
  const { user } = useUser();
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [familyResult, membersResult] = await Promise.all([
      getFamily(familyId),
      getFamilyMembers(familyId),
    ]);

    if (familyResult.error) {
      setError(familyResult.error);
    } else {
      setFamily(familyResult.data);
    }

    if (membersResult.error) {
      setError(membersResult.error);
    } else {
      setMembers(membersResult.data);
    }

    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    const { error: deleteError } = await deleteFamily(familyId);
    if (!deleteError) {
      router.push("/families");
    } else {
      setError(deleteError);
    }
  };

  if (loading) return <LoadingPage />;

  if (error && !family) {
    return (
      <div className="space-y-4">
        <Link href="/families">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux familles
          </Button>
        </Link>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!family) return null;

  const privacy = privacyConfig[family.privacy] ?? privacyConfig.private;
  const isOwner = family.owner_id === user?.id;
  const isAdmin = members.some(
    (m) => m.user_id === user?.id && (m.role === "OWNER" || m.role === "ADMIN")
  );

  return (
    <div className="space-y-6">
      <Link href="/families">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux familles
        </Button>
      </Link>

      {error && <ErrorMessage message={error} />}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={family.photo_url}
                firstName={family.name}
                size="xl"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {family.name}
                </h1>
                <Badge variant={privacy.variant} className="mt-1">
                  {privacy.icon}
                  <span className="ml-1">{privacy.label}</span>
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Inviter
                </Button>
              )}
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>

          {family.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              {family.description}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membres ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun membre dans cette famille.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {members.map((member) => (
                <div
                  key={`${member.family_id}-${member.user_id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.profiles?.avatar_url}
                      firstName={member.profiles?.first_name}
                      lastName={member.profiles?.last_name}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Rejoint le {formatDate(member.joined_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {roleLabels[member.role]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        familyId={familyId}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer la famille"
        message="Êtes-vous sûr de vouloir supprimer cette famille ? Cette action est irréversible et toutes les données associées seront perdues."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
      />
    </div>
  );
}
