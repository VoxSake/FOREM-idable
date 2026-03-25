"use client";

import { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { runtimeConfig } from "@/config/runtime";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { toast } from "sonner";

type AuthMode = "login" | "register";

function getDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function AuthSidebarPanel() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);

  const openDialog = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (nextMode === "login") {
      setFirstName("");
      setLastName("");
      setConfirmPassword("");
    }
    setIsOpen(true);
  };

  const handleAuth = async () => {
    if (mode === "register" && password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload =
        mode === "login"
          ? { email, password }
          : { email, password, firstName, lastName };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        toast.error(data.error || "Action impossible.");
        return;
      }

      setUser(data.user);
      await refresh();
      toast.success(mode === "login" ? "Connexion réussie." : "Compte créé.");
      setIsOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setConfirmPassword("");
      window.location.reload();
    } catch {
      toast.error("Action impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      await refresh();
      toast.success("Déconnecté.");
      window.location.reload();
    } catch {
      toast.error("Déconnexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
        <div className="space-y-1">
          {user ? (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {getDisplayName(user.firstName, user.lastName) || user.email}
                </p>
                <p className="break-all text-xs text-muted-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit capitalize">
                  {user.role}
                </Badge>
                <Link
                  href="/account"
                  className="inline-flex text-xs font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
                >
                  Mon compte
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleLogout}
                disabled={isSubmitting || isLoading}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connectez-vous pour suivre vos candidatures et retrouver votre historique.
            </p>
          )}
        </div>

        {!user && !isLoading ? (
          <div className="grid gap-2">
            <Button
              type="button"
              size="sm"
              className="w-full justify-start"
              onClick={() => openDialog("login")}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Connexion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => openDialog("register")}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Créer un compte
            </Button>
          </div>
        ) : null}

        {!user && isLoading ? (
          <div className="space-y-2">
            <div className="h-8 rounded-md bg-muted/60" />
            <div className="h-8 rounded-md bg-muted/40" />
          </div>
        ) : null}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "login" ? "Connexion" : "Créer un compte"}</DialogTitle>
            <DialogDescription>
              {mode === "login"
                ? "Retrouvez vos candidatures, votre historique et votre espace personnel."
                : "Créez un compte pour suivre vos candidatures et conserver votre historique."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {mode === "register" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="auth-sidebar-first-name"
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Prénom"
                />
                <Input
                  id="auth-sidebar-last-name"
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Nom"
                />
              </div>
            ) : null}
            <Input
              id="auth-sidebar-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@example.com"
            />
            <Input
              id={mode === "login" ? "auth-sidebar-current-password" : "auth-sidebar-new-password"}
              name={mode === "login" ? "current-password" : "new-password"}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe (8 caractères minimum)"
            />
            {mode === "login" && runtimeConfig.auth.passwordResetEnabled ? (
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start px-0 text-sm"
                onClick={() => setIsForgotPasswordDialogOpen(true)}
              >
                Mot de passe oublié ?
              </Button>
            ) : null}
            {mode === "register" ? (
              <Input
                id="auth-sidebar-confirm-password"
                name="new-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirmer le mot de passe"
              />
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleAuth()}
              disabled={
                isSubmitting ||
                !email.trim() ||
                password.length < 8 ||
                (mode === "register" &&
                  (!firstName.trim() ||
                    !lastName.trim() ||
                    confirmPassword.length < 8 ||
                    password !== confirmPassword))
              }
            >
              {mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ForgotPasswordDialog
        open={isForgotPasswordDialogOpen}
        onOpenChange={setIsForgotPasswordDialogOpen}
      />
    </>
  );
}
