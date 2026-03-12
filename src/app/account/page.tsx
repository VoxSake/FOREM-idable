"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, LoaderCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AuthUser } from "@/types/auth";
import { ApiKeyCreateResult, ApiKeySummary } from "@/types/externalApi";

export default function AccountPage() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyExpiry, setApiKeyExpiry] = useState("none");
  const [apiKeyFeedback, setApiKeyFeedback] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  const canManageApiKeys = user?.role === "coach" || user?.role === "admin";

  useEffect(() => {
    if (!canManageApiKeys) return;

    let cancelled = false;

    const loadApiKeys = async () => {
      setIsApiKeysLoading(true);
      setApiKeyFeedback(null);

      try {
        const response = await fetch("/api/account/api-keys", { cache: "no-store" });
        const data = (await response.json()) as { error?: string; apiKeys?: ApiKeySummary[] };

        if (cancelled) return;

        if (!response.ok || !data.apiKeys) {
          setApiKeyFeedback(data.error || "Chargement des clés API impossible.");
          return;
        }

        setApiKeys(data.apiKeys);
      } catch {
        if (!cancelled) {
          setApiKeyFeedback("Chargement des clés API impossible.");
        }
      } finally {
        if (!cancelled) {
          setIsApiKeysLoading(false);
        }
      }
    };

    void loadApiKeys();

    return () => {
      cancelled = true;
    };
  }, [canManageApiKeys]);

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
    if (password !== confirmPassword) {
      setPasswordFeedback("Les mots de passe ne correspondent pas.");
      return;
    }

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
      setConfirmPassword("");
      setPasswordFeedback("Mot de passe mis à jour.");
    } catch {
      setPasswordFeedback("Mise à jour impossible.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const createApiKey = async () => {
    setIsCreatingApiKey(true);
    setApiKeyFeedback(null);
    setNewApiKey(null);

    const expiresAt =
      apiKeyExpiry === "none"
        ? null
        : new Date(Date.now() + Number(apiKeyExpiry) * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: apiKeyName, expiresAt }),
      });
      const data = (await response.json()) as { error?: string } & Partial<ApiKeyCreateResult>;

      if (!response.ok || !data.apiKey || !data.plainTextKey) {
        setApiKeyFeedback(data.error || "Création de la clé API impossible.");
        return;
      }

      setApiKeyName("");
      setApiKeyExpiry("none");
      setNewApiKey(data.plainTextKey);
      setApiKeyFeedback("Clé API créée. Copie-la maintenant: elle ne sera plus réaffichée.");
      setApiKeys((current) => [data.apiKey as ApiKeySummary, ...current]);
    } catch {
      setApiKeyFeedback("Création de la clé API impossible.");
    } finally {
      setIsCreatingApiKey(false);
    }
  };

  const revokeApiKey = async (keyId: number) => {
    setRevokingApiKeyId(keyId);
    setApiKeyFeedback(null);

    try {
      const response = await fetch(`/api/account/api-keys/${keyId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setApiKeyFeedback(data.error || "Révocation impossible.");
        return;
      }

      setApiKeys((current) =>
        current.map((entry) =>
          entry.id === keyId ? { ...entry, revokedAt: new Date().toISOString() } : entry
        )
      );
      setApiKeyFeedback("Clé API révoquée.");
    } catch {
      setApiKeyFeedback("Révocation impossible.");
    } finally {
      setRevokingApiKeyId(null);
    }
  };

  const copyApiKey = async () => {
    if (!newApiKey) return;

    try {
      await navigator.clipboard.writeText(newApiKey);
      setApiKeyFeedback("Clé API copiée.");
    } catch {
      setApiKeyFeedback("Copie impossible, sélectionne la clé manuellement.");
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
        <div className="mt-4 space-y-3">
          <Label htmlFor="account-password">Nouveau mot de passe</Label>
          <Input
            id="account-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8 caractères minimum"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="account-password-confirm">Confirmer le mot de passe</Label>
          <Input
            id="account-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Ressaisir le mot de passe"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void savePassword()}
            disabled={
              isSavingPassword ||
              password.length < 8 ||
              confirmPassword.length < 8 ||
              password !== confirmPassword
            }
          >
            Changer le mot de passe
          </Button>
          {passwordFeedback && <p className="text-sm text-muted-foreground">{passwordFeedback}</p>}
        </div>
      </section>

      {canManageApiKeys ? (
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <KeyRound className="h-5 w-5 text-sky-600" />
              Clés API
            </h2>
            <p className="text-sm text-muted-foreground">
              Génère des clés Bearer en lecture seule pour Excel, Power Query ou d&apos;autres intégrations.
            </p>
          </div>
          <Separator className="my-4" />

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <Input
                value={apiKeyName}
                onChange={(event) => setApiKeyName(event.target.value)}
                placeholder="Ex: Excel Jordi, Power Query coach, Zapier..."
              />
              <select
                value={apiKeyExpiry}
                onChange={(event) => setApiKeyExpiry(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="none">Sans expiration</option>
                <option value="30">Expire dans 30 jours</option>
                <option value="90">Expire dans 90 jours</option>
                <option value="365">Expire dans 365 jours</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={() => void createApiKey()}
              disabled={isCreatingApiKey || !apiKeyName.trim()}
            >
              Générer une clé
            </Button>
          </div>

          {newApiKey ? (
            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/20">
              <p className="text-sm font-medium text-foreground">Nouvelle clé API</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Elle n&apos;est affichée qu&apos;une seule fois. Copie-la maintenant.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
                <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border bg-background px-3 py-2 text-xs">
                  {newApiKey}
                </code>
                <Button type="button" variant="outline" onClick={() => void copyApiKey()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copier
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Endpoints disponibles</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>`/api/external/me`</li>
                <li>`/api/external/users?search=&amp;groupId=&amp;role=&amp;format=json|csv`</li>
                <li>`/api/external/users/:id?format=json|csv`</li>
                <li>`/api/external/groups?search=&amp;format=json|csv`</li>
                <li>`/api/external/groups/:id?format=json|csv`</li>
                <li>`/api/external/applications?search=&amp;status=&amp;groupId=&amp;userId=&amp;dueOnly=1&amp;format=json|csv`</li>
              </ul>
              <p className="mt-3 text-xs">
                Authentification: header <code>Authorization: Bearer VOTRE_CLE</code>
              </p>
            </div>

            <div className="space-y-2">
              {apiKeys.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-xl border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.keyPrefix}...{entry.lastFour}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créée: {new Date(entry.createdAt).toLocaleString("fr-FR")}
                      {entry.expiresAt
                        ? ` • Expire: ${new Date(entry.expiresAt).toLocaleString("fr-FR")}`
                        : " • Sans expiration"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.lastUsedAt
                        ? ` • Dernier usage: ${new Date(entry.lastUsedAt).toLocaleString("fr-FR")}`
                        : "Jamais utilisée"}
                    </p>
                    {entry.revokedAt ? (
                      <p className="text-xs font-medium text-destructive">
                        Révoquée le {new Date(entry.revokedAt).toLocaleString("fr-FR")}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={Boolean(entry.revokedAt) || revokingApiKeyId === entry.id}
                    onClick={() => void revokeApiKey(entry.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Révoquer
                  </Button>
                </div>
              ))}
              {!isApiKeysLoading && apiKeys.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Aucune clé API pour l&apos;instant.
                </div>
              ) : null}
            </div>
          </div>

          {apiKeyFeedback && <p className="mt-4 text-sm text-muted-foreground">{apiKeyFeedback}</p>}
        </section>
      ) : null}
    </div>
  );
}
