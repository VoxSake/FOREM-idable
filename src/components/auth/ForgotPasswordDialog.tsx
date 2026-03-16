"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { runtimeConfig } from "@/config/runtime";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!runtimeConfig.auth.passwordResetEnabled) {
    return null;
  }

  const submit = async () => {
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setFeedback(data.error || "Envoi impossible.");
        return;
      }

      setFeedback(
        data.message ||
          "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé."
      );
    } catch {
      setFeedback("Envoi impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mot de passe oublié</DialogTitle>
          <DialogDescription>
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="vous@example.com"
          />
          {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
          <p className="text-xs text-muted-foreground">
            Le lien de réinitialisation expire après 60 minutes.
            {" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Confidentialité
            </Link>
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting || !email.trim()}
          >
            Envoyer le lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
