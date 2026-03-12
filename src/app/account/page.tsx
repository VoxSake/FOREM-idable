"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthUser } from "@/types/auth";

export default function AccountPage() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = (await response.json()) as { error?: string; user?: AuthUser };

      if (!response.ok || !data.user) {
        setProfileFeedback(data.error || "Mise à jour impossible.");
        return;
      }

      setUser(data.user);
      await refresh();
      setProfileFeedback("Nom et prénom mis à jour.");
    } catch {
      setProfileFeedback("Mise à jour impossible.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setIsSavingPassword(true);
    setPasswordFeedback(null);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPasswordFeedback(data.error || "Mise à jour impossible.");
        return;
      }

      setPassword("");
      setPasswordFeedback("Mot de passe mis à jour.");
    } catch {
      setPasswordFeedback("Mise à jour impossible.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
        Chargement du compte...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight">Mon compte</h1>
        <p className="mt-2 text-muted-foreground">
          Connectez-vous pour gérer votre profil et votre mot de passe.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Mon compte</h1>
        <p className="text-lg text-muted-foreground">
          Mettez à jour vos informations de profil et votre mot de passe.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Profil</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-first-name">Prénom</Label>
            <Input
              id="account-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Prénom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-last-name">Nom</Label>
            <Input
              id="account-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Nom"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => void saveProfile()}
            disabled={isSavingProfile || !firstName.trim() || !lastName.trim()}
          >
            Enregistrer le profil
          </Button>
          {profileFeedback && <p className="text-sm text-muted-foreground">{profileFeedback}</p>}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Sécurité</h2>
          <p className="text-sm text-muted-foreground">Choisissez un mot de passe de 8 caractères minimum.</p>
        </div>
        <Separator className="my-4" />
        <div className="space-y-2">
          <Label htmlFor="account-password">Nouveau mot de passe</Label>
          <Input
            id="account-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8 caractères minimum"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void savePassword()}
            disabled={isSavingPassword || password.length < 8}
          >
            Changer le mot de passe
          </Button>
          {passwordFeedback && <p className="text-sm text-muted-foreground">{passwordFeedback}</p>}
        </div>
      </section>
    </div>
  );
}
