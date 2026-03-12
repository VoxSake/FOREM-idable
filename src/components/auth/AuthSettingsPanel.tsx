"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";

export function AuthSettingsPanel() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (mode: "login" | "register") => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { id: number; email: string; role: "user" | "coach" | "admin" };
      };

      if (!response.ok || !data.user) {
        setFeedback(data.error || "Action impossible.");
        return;
      }

      setUser(data.user);
      setFeedback(mode === "login" ? "Connecté. Synchronisation en cours." : "Compte créé. Synchronisation en cours.");

      await refresh();
      window.location.reload();
    } catch {
      setFeedback("Action impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      await refresh();
      setFeedback("Déconnecté.");
      window.location.reload();
    } catch {
      setFeedback("Déconnexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Compte</h2>
      <Separator />

      {user ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connecté en tant que <span className="font-semibold text-foreground">{user.email}</span>.
            Vos favoris, candidatures, paramètres et recherches sont synchronisés via Postgres.
          </p>
          <Badge variant="secondary" className="w-fit capitalize">
            {user.role}
          </Badge>
          <Button type="button" variant="outline" onClick={handleLogout} disabled={isSubmitting || isLoading}>
            Se déconnecter
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Créez un compte ou connectez-vous pour retrouver vos données sur plusieurs appareils.
          </p>
          <div className="space-y-2">
            <Label htmlFor="auth-email">Adresse email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Mot de passe</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handleAuth("login")}
              disabled={isSubmitting || !email.trim() || password.length < 8}
            >
              Se connecter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleAuth("register")}
              disabled={isSubmitting || !email.trim() || password.length < 8}
            >
              Créer un compte
            </Button>
          </div>
        </div>
      )}

      {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
    </div>
  );
}
