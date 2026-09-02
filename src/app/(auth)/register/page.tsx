"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, Check } from "lucide-react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const passwordChecks = [
    { label: "8 caractères minimum", valid: password.length >= 8 },
    { label: "Une majuscule", valid: /[A-Z]/.test(password) },
    { label: "Un chiffre", valid: /[0-9]/.test(password) },
  ];

  const handleRegister = async (e: React.FormEvent) => {
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

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Compte créé !
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Un email de confirmation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception.
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Aller à la connexion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-[#0B6E4F] flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">WIDE</span>
        </div>
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez WIDE et préservez votre histoire familiale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              placeholder="Jean"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Nom"
              placeholder="Kabila"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && (
            <div className="space-y-1">
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-xs">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center ${check.valid ? "bg-green-500" : "bg-gray-300"}`}>
                    {check.valid && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className={check.valid ? "text-green-600" : "text-gray-500"}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && password !== confirmPassword ? "Les mots de passe ne correspondent pas" : undefined}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" loading={loading}>
            Créer mon compte
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-[#0B6E4F] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
