"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setValidSession(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => router.push("/dashboard"), 3000);
  };

  if (!validSession) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            Lien de réinitialisation invalide ou expiré.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">Demander un nouveau lien</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Mot de passe réinitialisé
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Votre mot de passe a été mis à jour. Redirection...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && password !== confirmPassword ? "Les mots de passe ne correspondent pas" : undefined}
          />

          <Button type="submit" className="w-full" loading={loading}>
            Réinitialiser le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
