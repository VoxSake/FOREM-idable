"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/useSettings";
import { useAccountApiKeys } from "@/hooks/useAccountApiKeys";
import { useToastFeedback } from "@/hooks/useToastFeedback";
import { AuthUser } from "@/types/auth";
import {
  AccountDeletionRequestSummary,
  ApiKeyFormValues,
  DataExportRequestSummary,
  FeedbackState,
  PasswordFormValues,
  ProfileFormValues,
  apiKeySchema,
  passwordSchema,
  profileSchema,
} from "./account.schemas";
import { AccountDeletionSection } from "./components/AccountDeletionSection";
import { ApiKeysSection } from "./components/ApiKeysSection";
import { DataExportSection } from "./components/DataExportSection";
import { PasswordSection } from "./components/PasswordSection";
import { ProfileSection } from "./components/ProfileSection";
import { SearchPreferencesSection } from "./components/SearchPreferencesSection";

const sectionClassName = "overflow-hidden shadow-sm";

function AccountPageSkeleton() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AccountPage() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings();
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState | null>(null);
  const [dataExportFeedback, setDataExportFeedback] = useState<FeedbackState | null>(null);
  const [deletionFeedback, setDeletionFeedback] = useState<FeedbackState | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoadingExports, setIsLoadingExports] = useState(false);
  const [isLoadingDeletionRequests, setIsLoadingDeletionRequests] = useState(false);
  const [isGeneratingExport, setIsGeneratingExport] = useState(false);
  const [isSubmittingDeletionRequest, setIsSubmittingDeletionRequest] = useState(false);
  const [dataExportRequests, setDataExportRequests] = useState<DataExportRequestSummary[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequestSummary[]>([]);

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

  const [currentFirstName = "", currentLastName = ""] = useWatch({
    control: profileForm.control,
    name: ["firstName", "lastName"],
  });
  const [currentPassword = "", currentPasswordConfirmation = ""] = useWatch({
    control: passwordForm.control,
    name: ["password", "confirmPassword"],
  });
  const [currentApiKeyName = "", currentApiKeyExpiry = "none"] = useWatch({
    control: apiKeyForm.control,
    name: ["name", "expiry"],
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }, [profileForm, user]);

  const canManageApiKeys = user?.role === "coach" || user?.role === "admin";
  const apiKeys = useAccountApiKeys({ enabled: canManageApiKeys });

  useToastFeedback(profileFeedback, { title: "Mise à jour du profil" });
  useToastFeedback(passwordFeedback, { title: "Mot de passe" });
  useToastFeedback(apiKeys.feedback, { title: "Clés API" });
  useToastFeedback(dataExportFeedback, { title: "Export de données" });
  useToastFeedback(deletionFeedback, { title: "Suppression du compte" });

  const isProfileUnchanged = useMemo(
    () =>
      !user ||
      (currentFirstName.trim() === user.firstName.trim() &&
        currentLastName.trim() === user.lastName.trim()),
    [currentFirstName, currentLastName, user]
  );
  const isPasswordEmpty = currentPassword.length === 0 && currentPasswordConfirmation.length === 0;

  const canSubmitProfile =
    !isSavingProfile && !isProfileUnchanged && profileForm.formState.isValid;
  const canSubmitPassword =
    !isSavingPassword && !isPasswordEmpty && passwordForm.formState.isValid;
  const canSubmitApiKey =
    !apiKeys.isCreating &&
    currentApiKeyName.trim().length > 0 &&
    apiKeyForm.formState.isValid;

  const loadDataExportRequests = useCallback(async () => {
    setIsLoadingExports(true);

    try {
      const response = await fetch("/api/account/data-export");
      const data = (await response.json()) as {
        error?: string;
        requests?: DataExportRequestSummary[];
      };

      if (!response.ok || !data.requests) {
        setDataExportFeedback({
          type: "error",
          message: data.error || "Chargement des exports impossible.",
        });
        return;
      }

      setDataExportRequests(data.requests);
    } catch {
      setDataExportFeedback({
        type: "error",
        message: "Chargement des exports impossible.",
      });
    } finally {
      setIsLoadingExports(false);
    }
  }, []);

  const loadDeletionRequests = useCallback(async () => {
    setIsLoadingDeletionRequests(true);

    try {
      const response = await fetch("/api/account/deletion-request");
      const data = (await response.json()) as {
        error?: string;
        requests?: AccountDeletionRequestSummary[];
      };

      if (!response.ok || !data.requests) {
        setDeletionFeedback({
          type: "error",
          message: data.error || "Chargement des demandes impossible.",
        });
        return;
      }

      setDeletionRequests(data.requests);
    } catch {
      setDeletionFeedback({
        type: "error",
        message: "Chargement des demandes impossible.",
      });
    } finally {
      setIsLoadingDeletionRequests(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setDataExportRequests([]);
      setDeletionRequests([]);
      return;
    }

    void loadDataExportRequests();
    void loadDeletionRequests();
  }, [loadDataExportRequests, loadDeletionRequests, user]);

  const saveProfile = useCallback(async (values: ProfileFormValues) => {
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
  }, [profileForm, refresh, setUser]);

  const savePassword = useCallback(async (values: PasswordFormValues) => {
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
  }, [passwordForm]);

  const createApiKey = useCallback(async (values: ApiKeyFormValues) => {
    const wasCreated = await apiKeys.createApiKey(values);
    if (!wasCreated) {
      return;
    }

    apiKeyForm.reset({
      name: "",
      expiry: "none",
    });
  }, [apiKeyForm, apiKeys]);

  const generateDataExport = useCallback(async () => {
    setIsGeneratingExport(true);
    setDataExportFeedback(null);

    try {
      const response = await fetch("/api/account/data-export", {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        request?: DataExportRequestSummary;
      };

      if (!response.ok || !data.request) {
        setDataExportFeedback({
          type: "error",
          message: data.error || "Export impossible.",
        });
        return;
      }

      await loadDataExportRequests();
      setDataExportFeedback({
        type: "success",
        message: "Export généré. Vous pouvez maintenant le télécharger.",
      });
    } catch {
      setDataExportFeedback({
        type: "error",
        message: "Export impossible.",
      });
    } finally {
      setIsGeneratingExport(false);
    }
  }, [loadDataExportRequests]);

  const downloadDataExport = useCallback((requestId: number) => {
    window.location.href = `/api/account/data-export/${requestId}`;
  }, []);

  const submitDeletionRequest = useCallback(async (reason: string) => {
    setIsSubmittingDeletionRequest(true);
    setDeletionFeedback(null);

    try {
      const response = await fetch("/api/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = (await response.json()) as {
        error?: string;
        request?: AccountDeletionRequestSummary;
      };

      if (!response.ok || !data.request) {
        setDeletionFeedback({
          type: "error",
          message: data.error || "Demande impossible.",
        });
        return;
      }

      await loadDeletionRequests();
      setDeletionFeedback({
        type: "success",
        message: "Demande de suppression enregistrée.",
      });
    } catch {
      setDeletionFeedback({
        type: "error",
        message: "Demande impossible.",
      });
    } finally {
      setIsSubmittingDeletionRequest(false);
    }
  }, [loadDeletionRequests]);

  const cancelDeletionRequest = useCallback(async () => {
    setIsSubmittingDeletionRequest(true);
    setDeletionFeedback(null);

    try {
      const response = await fetch("/api/account/deletion-request", {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        error?: string;
        request?: AccountDeletionRequestSummary;
      };

      if (!response.ok || !data.request) {
        setDeletionFeedback({
          type: "error",
          message: data.error || "Annulation impossible.",
        });
        return;
      }

      await loadDeletionRequests();
      setDeletionFeedback({
        type: "success",
        message: "Demande de suppression annulée.",
      });
    } catch {
      setDeletionFeedback({
        type: "error",
        message: "Annulation impossible.",
      });
    } finally {
      setIsSubmittingDeletionRequest(false);
    }
  }, [loadDeletionRequests]);

  const handleSearchModeChange = useCallback(
    (value: "AND" | "OR") => {
      updateSettings({ defaultSearchMode: value });
    },
    [updateSettings]
  );

  if (isLoading || !isSettingsLoaded) {
    return <AccountPageSkeleton />;
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight">Mon compte</h1>
          <p className="max-w-2xl text-muted-foreground">
            Gérez votre profil, votre sécurité et vos préférences sans perdre d&apos;espace à
            l&apos;écran.
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

      <div className="grid gap-6">
        <Card className={sectionClassName}>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl">Compte</CardTitle>
              <CardDescription>
                Gérez votre identité, votre mot de passe et vos préférences de recherche depuis un
                seul espace.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ProfileSection
                form={profileForm}
                canSubmit={canSubmitProfile}
                isSubmitting={isSavingProfile}
                onSubmit={saveProfile}
              />
              <PasswordSection
                form={passwordForm}
                canSubmit={canSubmitPassword}
                isSubmitting={isSavingPassword}
                onSubmit={savePassword}
              />
            </div>

            <Separator />

            <SearchPreferencesSection
              value={settings.defaultSearchMode}
              onChange={handleSearchModeChange}
            />
          </CardContent>
        </Card>

        {canManageApiKeys ? (
          <ApiKeysSection
            form={apiKeyForm}
            apiKeys={apiKeys.apiKeys}
            newApiKey={apiKeys.newApiKey}
            isLoading={apiKeys.isLoading}
            isCreating={apiKeys.isCreating}
            canSubmit={canSubmitApiKey}
            currentExpiry={currentApiKeyExpiry}
            revokingApiKeyId={apiKeys.revokingApiKeyId}
            onSubmit={createApiKey}
            onCopy={apiKeys.copyApiKey}
            onRevoke={apiKeys.revokeApiKey}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <DataExportSection
            requests={dataExportRequests}
            isLoading={isLoadingExports}
            isExporting={isGeneratingExport}
            onCreate={generateDataExport}
            onDownload={downloadDataExport}
          />
          <AccountDeletionSection
            requests={deletionRequests}
            isLoading={isLoadingDeletionRequests}
            isSubmitting={isSubmittingDeletionRequest}
            onSubmit={submitDeletionRequest}
            onCancel={cancelDeletionRequest}
          />
        </div>
      </div>
    </div>
  );
}
