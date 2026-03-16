"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { runtimeConfig } from "@/config/runtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!runtimeConfig.auth.passwordResetEnabled) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Réinitialisation indisponible</h1>
          <p className="text-lg text-muted-foreground">
            Cette fonctionnalité n’est pas activée sur cette instance.
          </p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!token) {
      setFeedback("Lien invalide ou incomplet.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("Les mots de passe ne correspondent pas.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(data.error || "Réinitialisation impossible.");
        return;
      }

      setIsSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setFeedback("Réinitialisation impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Choisir un nouveau mot de passe</h1>
        <p className="text-lg text-muted-foreground">
          Définissez un nouveau mot de passe pour votre compte FOREM-idable.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        {isSuccess ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Votre mot de passe a été mis à jour. Vous pouvez maintenant vous reconnecter.
            </p>
            <Button asChild>
              <Link href="/account">Aller vers Mon compte</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reset-password">
                Nouveau mot de passe
              </label>
              <Input
                id="reset-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 caractères minimum"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reset-password-confirm">
                Confirmer le mot de passe
              </label>
              <Input
                id="reset-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmer le mot de passe"
              />
            </div>
            {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
            <Button
              type="button"
              onClick={() => void submit()}
              disabled={
                isSubmitting ||
                !token ||
                password.length < 8 ||
                confirmPassword.length < 8 ||
                password !== confirmPassword
              }
            >
              Mettre à jour le mot de passe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
