"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/AuthProvider";

type AuthMode = "login" | "register";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: AuthMode;
  title?: string;
  description?: string;
  onSuccess?: () => Promise<void> | void;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
  mode: forcedMode,
  title,
  description,
  onSuccess,
}: AuthRequiredDialogProps) {
  const { refresh, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(forcedMode ?? "login");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveMode = forcedMode ?? mode;
  const effectiveTitle =
    title ??
    (effectiveMode === "login" ? "Connexion" : "Créer un compte");
  const effectiveDescription =
    description ??
    (effectiveMode === "login"
      ? "Connectez-vous pour suivre vos candidatures et retrouver votre historique."
      : "Créez un compte pour suivre vos candidatures et retrouver votre historique.");

  const submit = async () => {
    if (effectiveMode === "register" && password !== confirmPassword) {
      setFeedback("Les mots de passe ne correspondent pas.");
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${effectiveMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
          role: "user" | "coach" | "admin";
        };
      };

      if (!response.ok || !data.user) {
        setFeedback(data.error || "Action impossible.");
        return;
      }

      setUser(data.user);
      await refresh();
      await onSuccess?.();
      onOpenChange(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setFeedback("Action impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{effectiveTitle}</DialogTitle>
          <DialogDescription>{effectiveDescription}</DialogDescription>
        </DialogHeader>

        {!forcedMode ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("login")}
            >
              Connexion
            </Button>
            <Button
              type="button"
              variant={mode === "register" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("register")}
            >
              Créer un compte
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {effectiveMode === "register" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Prénom" />
              <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nom" />
            </div>
          ) : null}
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@example.com"
          />
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mot de passe (8 caractères minimum)"
          />
          {effectiveMode === "register" ? (
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmer le mot de passe"
            />
          ) : null}
          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={
              isSubmitting ||
              !email.trim() ||
              password.length < 8 ||
              (effectiveMode === "register" &&
                (!firstName.trim() ||
                  !lastName.trim() ||
                  confirmPassword.length < 8 ||
                  password !== confirmPassword))
            }
          >
            {effectiveMode === "login" ? "Se connecter" : "Créer un compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
