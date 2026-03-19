"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Copy,
  KeyRound,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSettings } from "@/hooks/useSettings";
import { useForm } from "react-hook-form";
import { AuthUser } from "@/types/auth";
import { ApiKeyCreateResult, ApiKeySummary } from "@/types/externalApi";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
});

const passwordSchema = z
  .object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
    confirmPassword: z.string().min(8, "La confirmation doit contenir au moins 8 caractères."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas.",
  });

const apiKeySchema = z.object({
  name: z.string().trim().min(1, "Le nom de la clé est requis."),
  expiry: z.enum(["none", "30", "90", "365"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type ApiKeyFormValues = z.infer<typeof apiKeySchema>;
type FeedbackState = {
  type: "success" | "error";
  message: string;
};

export default function AccountPage() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings();
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeyFeedback, setApiKeyFeedback] = useState<FeedbackState | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isApiKeysLoading, setIsApiKeysLoading] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [revokingApiKeyId, setRevokingApiKeyId] = useState<number | null>(null);
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      expiry: "none",
    },
  });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }, [profileForm, user]);

  const canManageApiKeys = user?.role === "coach" || user?.role === "admin";
  const sectionClassName = "overflow-hidden shadow-sm";

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
          setApiKeyFeedback({
            type: "error",
            message: data.error || "Chargement des clés API impossible.",
          });
          return;
        }

        setApiKeys(data.apiKeys);
      } catch {
        if (!cancelled) {
          setApiKeyFeedback({
            type: "error",
            message: "Chargement des clés API impossible.",
          });
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

  const saveProfile = async (values: ProfileFormValues) => {
    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { error?: string; user?: AuthUser };

      if (!response.ok || !data.user) {
        setProfileFeedback({
          type: "error",
          message: data.error || "Mise à jour impossible.",
        });
        return;
      }

      setUser(data.user);
      profileForm.reset({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
      });
      await refresh();
      setProfileFeedback({
        type: "success",
        message: "Nom et prénom mis à jour.",
      });
    } catch {
      setProfileFeedback({
        type: "error",
        message: "Mise à jour impossible.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePassword = async (values: PasswordFormValues) => {
    setIsSavingPassword(true);
    setPasswordFeedback(null);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setPasswordFeedback({
          type: "error",
          message: data.error || "Mise à jour impossible.",
        });
        return;
      }

      passwordForm.reset();
      setPasswordFeedback({
        type: "success",
        message: "Mot de passe mis à jour.",
      });
    } catch {
      setPasswordFeedback({
        type: "error",
        message: "Mise à jour impossible.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const createApiKey = async (values: ApiKeyFormValues) => {
    setIsCreatingApiKey(true);
    setApiKeyFeedback(null);
    setNewApiKey(null);

    const expiresAt =
      values.expiry === "none"
        ? null
        : new Date(Date.now() + Number(values.expiry) * 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, expiresAt }),
      });
      const data = (await response.json()) as { error?: string } & Partial<ApiKeyCreateResult>;

      if (!response.ok || !data.apiKey || !data.plainTextKey) {
        setApiKeyFeedback({
          type: "error",
          message: data.error || "Création de la clé API impossible.",
        });
        return;
      }

      apiKeyForm.reset({
        name: "",
        expiry: "none",
      });
      setNewApiKey(data.plainTextKey);
      setApiKeyFeedback({
        type: "success",
        message: "Clé API créée. Copie-la maintenant: elle ne sera plus réaffichée.",
      });
      setApiKeys((current) => [data.apiKey as ApiKeySummary, ...current]);
    } catch {
      setApiKeyFeedback({
        type: "error",
        message: "Création de la clé API impossible.",
      });
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
        setApiKeyFeedback({
          type: "error",
          message: data.error || "Révocation impossible.",
        });
        return;
      }

      setApiKeys((current) =>
        current.map((entry) =>
          entry.id === keyId ? { ...entry, revokedAt: new Date().toISOString() } : entry
        )
      );
      setApiKeyFeedback({
        type: "success",
        message: "Clé API révoquée.",
      });
    } catch {
      setApiKeyFeedback({
        type: "error",
        message: "Révocation impossible.",
      });
    } finally {
      setRevokingApiKeyId(null);
    }
  };

  const copyApiKey = async () => {
    if (!newApiKey) return;

    try {
      await navigator.clipboard.writeText(newApiKey);
      setApiKeyFeedback({
        type: "success",
        message: "Clé API copiée.",
      });
    } catch {
      setApiKeyFeedback({
        type: "error",
        message: "Copie impossible, sélectionne la clé manuellement.",
      });
    }
  };

  if (isLoading || !isSettingsLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
        Chargement du compte...
      </div>
    );
  }

  if (!user) {
    return (
      <AccountAccessPrompt
        title="Mon compte"
        description="Connectez-vous pour gérer votre profil, votre mot de passe et vos clés API."
        summary="Avec un compte, vous retrouvez votre suivi, vos paramètres personnels et, pour les coachs, vos clés API."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Mon compte</h1>
          <p className="max-w-2xl text-muted-foreground">
            Gérez votre profil, votre sécurité et vos préférences sans perdre d&apos;espace à l&apos;écran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
            <UserRound className="h-3.5 w-3.5" />
            {user.email}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm capitalize">
            {user.role}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={sectionClassName}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">Profil</CardTitle>
                <CardDescription>
                  Vos informations publiques de base et l&apos;identité utilisée dans
                  l&apos;application.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Separator />
            <form
              className="flex flex-col gap-4"
              onSubmit={profileForm.handleSubmit(async (values) => {
                await saveProfile(values);
              })}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="account-first-name">Prénom</Label>
                  <Input
                    id="account-first-name"
                    autoComplete="given-name"
                    placeholder="Prénom"
                    {...profileForm.register("firstName")}
                    aria-invalid={profileForm.formState.errors.firstName ? "true" : "false"}
                  />
                  {profileForm.formState.errors.firstName ? (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.firstName.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="account-last-name">Nom</Label>
                  <Input
                    id="account-last-name"
                    autoComplete="family-name"
                    placeholder="Nom"
                    {...profileForm.register("lastName")}
                    aria-invalid={profileForm.formState.errors.lastName ? "true" : "false"}
                  />
                  {profileForm.formState.errors.lastName ? (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.lastName.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    isSavingProfile ||
                    !profileForm.formState.isDirty ||
                    !profileForm.formState.isValid
                  }
                >
                  Enregistrer le profil
                </Button>
                {profileFeedback ? (
                  <Alert
                    variant={profileFeedback.type === "error" ? "destructive" : "default"}
                    className="min-w-0 flex-1"
                  >
                    <AlertTitle>Mise à jour du profil</AlertTitle>
                    <AlertDescription>{profileFeedback.message}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={sectionClassName}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">Sécurité</CardTitle>
                <CardDescription>
                  Choisissez un mot de passe de 8 caractères minimum.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Separator />
            <form
              className="flex flex-col gap-5"
              onSubmit={passwordForm.handleSubmit(async (values) => {
                await savePassword(values);
              })}
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="account-password">Nouveau mot de passe</Label>
                  <Input
                    id="account-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="8 caractères minimum"
                    {...passwordForm.register("password")}
                    aria-invalid={passwordForm.formState.errors.password ? "true" : "false"}
                  />
                  {passwordForm.formState.errors.password ? (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
                  <Label htmlFor="account-password-confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="account-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ressaisir le mot de passe"
                    {...passwordForm.register("confirmPassword")}
                    aria-invalid={passwordForm.formState.errors.confirmPassword ? "true" : "false"}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="text-sm text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={
                    isSavingPassword ||
                    !passwordForm.formState.isDirty ||
                    !passwordForm.formState.isValid
                  }
                >
                  Changer le mot de passe
                </Button>
                {passwordFeedback ? (
                  <Alert
                    variant={passwordFeedback.type === "error" ? "destructive" : "default"}
                    className="min-w-0 flex-1"
                  >
                    <AlertTitle>Mot de passe</AlertTitle>
                    <AlertDescription>{passwordFeedback.message}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className={sectionClassName}>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">Recherche</CardTitle>
                <CardDescription>
                  Définissez le lien initial entre vos mots-clés lors d&apos;une nouvelle recherche.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Separator />
            <ToggleGroup
              type="single"
              variant="outline"
              value={settings.defaultSearchMode}
              onValueChange={(value) => {
                if (value === "AND" || value === "OR") {
                  updateSettings({ defaultSearchMode: value });
                }
              }}
              className="flex w-full flex-wrap"
            >
              <ToggleGroupItem value="OR" className="flex-1">
                OU (plus de résultats)
              </ToggleGroupItem>
              <ToggleGroupItem value="AND" className="flex-1">
                ET (plus précis)
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">OU</strong> élargit les résultats,
              <strong className="ml-1 font-medium text-foreground">ET</strong> les rend plus précis.
            </p>
          </CardContent>
        </Card>

        {canManageApiKeys ? (
          <Card className={`${sectionClassName} lg:col-span-2`}>
            <CardHeader>
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Clés API
                </CardTitle>
                <CardDescription>
                  Génère des clés Bearer en lecture seule pour Excel, Power Query ou d&apos;autres
                  intégrations.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Separator />

              <form
                className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                onSubmit={apiKeyForm.handleSubmit(async (values) => {
                  await createApiKey(values);
                })}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Ex: Excel Jordi, Power Query coach, Zapier..."
                      {...apiKeyForm.register("name")}
                      aria-invalid={apiKeyForm.formState.errors.name ? "true" : "false"}
                    />
                    {apiKeyForm.formState.errors.name ? (
                      <p className="text-sm text-destructive">
                        {apiKeyForm.formState.errors.name.message}
                      </p>
                    ) : null}
                  </div>
                  <Select
                    value={apiKeyForm.watch("expiry")}
                    onValueChange={(value) =>
                      apiKeyForm.setValue("expiry", value as ApiKeyFormValues["expiry"], {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Expiration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="none">Sans expiration</SelectItem>
                        <SelectItem value="30">Expire dans 30 jours</SelectItem>
                        <SelectItem value="90">Expire dans 90 jours</SelectItem>
                        <SelectItem value="365">Expire dans 365 jours</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={isCreatingApiKey || !apiKeyForm.formState.isValid}
                >
                  Générer une clé
                </Button>
              </form>

              {newApiKey ? (
                <Alert>
                  <AlertTitle>Nouvelle clé API</AlertTitle>
                  <AlertDescription className="gap-3">
                    <p>Elle n&apos;est affichée qu&apos;une seule fois. Copie-la maintenant.</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <code className="block min-w-0 flex-1 overflow-x-auto rounded-lg border bg-background px-3 py-2 text-xs">
                        {newApiKey}
                      </code>
                      <Button type="button" variant="outline" onClick={() => void copyApiKey()}>
                        <Copy data-icon="inline-start" />
                        Copier
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              <Card className="shadow-none">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Endpoints disponibles</CardTitle>
                  <CardDescription>
                    Authentification: header{" "}
                    <code>Authorization: Bearer VOTRE_CLE</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="grid gap-1 text-xs md:grid-cols-2">
                    <li>`/api/external/me`</li>
                    <li>`/api/external/users?search=&amp;groupId=&amp;role=&amp;format=json|csv`</li>
                    <li>`/api/external/users/:id?format=json|csv`</li>
                    <li>`/api/external/groups?search=&amp;format=json|csv`</li>
                    <li>`/api/external/groups/:id?format=json|csv`</li>
                    <li>`/api/external/applications?search=&amp;status=&amp;groupId=&amp;userId=&amp;dueOnly=1&amp;format=json|csv`</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
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
                      <Trash2 data-icon="inline-start" />
                      Révoquer
                    </Button>
                  </div>
                ))}
                {!isApiKeysLoading && apiKeys.length === 0 ? (
                  <Empty className="min-h-40 border">
                    <EmptyHeader>
                      <EmptyTitle>Aucune clé API pour l&apos;instant.</EmptyTitle>
                      <EmptyDescription>
                        Générez une première clé pour connecter Excel, Power Query ou une intégration externe.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}
              </div>

              {apiKeyFeedback ? (
                <Alert
                  variant={apiKeyFeedback.type === "error" ? "destructive" : "default"}
                  className="min-w-0"
                >
                  <AlertTitle>Clés API</AlertTitle>
                  <AlertDescription>{apiKeyFeedback.message}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
