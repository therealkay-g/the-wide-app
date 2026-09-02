"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { useUser } from "@/hooks/use-user";
import { inviteToFamily } from "@/services/families";
import type { FamilyRole } from "@/types";

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
}

export function InviteMemberDialog({ open, onClose, familyId }: InviteMemberDialogProps) {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<FamilyRole>("VIEWER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: inviteError } = await inviteToFamily(
      familyId,
      email,
      role,
      user.id
    );

    if (inviteError) {
      setError(inviteError);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setEmail("");
    setRole("VIEWER");
    setLoading(false);

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setRole("VIEWER");
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Inviter un membre"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Fermer
          </Button>
          {!success && (
            <Button type="submit" form="invite-member-form" loading={loading}>
              Envoyer l&apos;invitation
            </Button>
          )}
        </>
      }
    >
      <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={error} />

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            Invitation envoyée avec succès !
          </div>
        )}

        <Input
          label="Adresse e-mail"
          type="email"
          placeholder="membre@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || success}
        />

        <Select
          label="Rôle"
          value={role}
          onChange={(e) => setRole(e.target.value as FamilyRole)}
          options={[
            { value: "VIEWER", label: "Observateur - Lecture seule" },
            { value: "CONTRIBUTOR", label: "Contributeur - Peut ajouter du contenu" },
            { value: "EDITOR", label: "Éditeur - Peut modifier le contenu" },
            { value: "ADMIN", label: "Administrateur - Gestion complète" },
          ]}
          disabled={loading || success}
        />
      </form>
    </Dialog>
  );
}
