"use client";

import { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
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

type AuthMode = "login" | "register";

export function AuthSidebarPanel() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = (nextMode: AuthMode) => {
    setMode(nextMode);
    setFeedback(null);
    setIsOpen(true);
  };

  const handleAuth = async () => {
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
      await refresh();
      setIsOpen(false);
      setEmail("");
      setPassword("");
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
      window.location.reload();
    } catch {
      setFeedback("Déconnexion impossible.");
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
                <p className="break-all text-sm font-medium text-foreground">{user.email}</p>
                <Badge variant="secondary" className="w-fit capitalize">
                  {user.role}
                </Badge>
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
              Connectez-vous pour synchroniser vos données sur plusieurs appareils.
            </p>
          )}
        </div>

        {!user ? (
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

        {feedback && <p className="text-xs text-muted-foreground">{feedback}</p>}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "login" ? "Connexion" : "Créer un compte"}</DialogTitle>
            <DialogDescription>
              {mode === "login"
                ? "Retrouvez vos favoris, candidatures et paramètres synchronisés."
                : "Créez un compte pour synchroniser vos données entre appareils."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
            {feedback && <p className="text-sm text-muted-foreground">{feedback}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleAuth()}
              disabled={isSubmitting || !email.trim() || password.length < 8}
            >
              {mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
