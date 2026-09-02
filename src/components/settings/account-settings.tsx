"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/ui/error-message";
import { Mail, Lock, Trash2 } from "lucide-react";

export function AccountSettings() {
  const router = useRouter();
  const supabase = createClient();
  const [currentEmail, setCurrentEmail] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setCurrentEmail(data.user.email);
      }
    });
  }, []);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(true);
      setNewEmail("");
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== "SUPPRIMER") return;
    setDeleteLoading(true);
    setDeleteError(null);

    const { error } = await supabase.rpc("delete_user_account" as never);
    if (error) {
      setDeleteError("Impossible de supprimer le compte. Contactez le support.");
      setDeleteLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      {/* Change email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Adresse email
          </CardTitle>
          <CardDescription>
            Email actuel : {currentEmail}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <ErrorMessage message={emailError} />
            {emailSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                Un email de confirmation a été envoyé à votre nouvelle adresse.
              </div>
            )}
            <Input
              label="Nouvel email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nouveau@email.com"
            />
            <Button type="submit" loading={emailLoading} disabled={!newEmail.trim()}>
              Changer l&apos;email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe de connexion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <ErrorMessage message={passwordError} />
            {passwordSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                Mot de passe modifié avec succès.
              </div>
            )}
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le mot de passe"
            />
            <Button type="submit" loading={passwordLoading} disabled={!newPassword || !confirmPassword}>
              Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone: delete account */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Supprimer le compte
          </CardTitle>
          <CardDescription>
            Cette action est irréversible. Toutes vos données seront supprimées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmDeleteText("");
          setDeleteError(null);
        }}
        title="Supprimer votre compte"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setConfirmDeleteText("");
                setDeleteError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={deleteLoading}
              disabled={confirmDeleteText !== "SUPPRIMER"}
              onClick={handleDeleteAccount}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <ErrorMessage message={deleteError} />
          <p className="text-sm text-gray-600">
            Cette action supprimera définitivement votre compte et toutes les données associées. Cette action est irréversible.
          </p>
          <p className="text-sm text-gray-600">
            Tapez <strong>SUPPRIMER</strong> pour confirmer.
          </p>
          <Input
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder="SUPPRIMER"
          />
        </div>
      </Dialog>
    </div>
  );
}
