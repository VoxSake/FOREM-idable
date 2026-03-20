"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, UserRound } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { AccountAccessPrompt } from "@/components/auth/AccountAccessPrompt";
import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/useSettings";
import { useAccountApiKeys } from "@/hooks/useAccountApiKeys";
import { AuthUser } from "@/types/auth";
import {
  ApiKeyFormValues,
  FeedbackState,
  PasswordFormValues,
  ProfileFormValues,
  apiKeySchema,
  passwordSchema,
  profileSchema,
} from "./account.schemas";
import { ApiKeysSection } from "./components/ApiKeysSection";
import { PasswordSection } from "./components/PasswordSection";
import { ProfileSection } from "./components/ProfileSection";
import { SearchPreferencesSection } from "./components/SearchPreferencesSection";

const sectionClassName = "overflow-hidden shadow-sm";

export default function AccountPage() {
  const { user, isLoading, refresh, setUser } = useAuth();
  const { settings, updateSettings, isLoaded: isSettingsLoaded } = useSettings();
  const [profileFeedback, setProfileFeedback] = useState<FeedbackState | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
    const wasCreated = await apiKeys.createApiKey(values);
    if (!wasCreated) {
      return;
    }

    apiKeyForm.reset({
      name: "",
      expiry: "none",
    });
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6 animate-in fade-in duration-500">
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
                feedback={profileFeedback}
                onSubmit={saveProfile}
              />
              <PasswordSection
                form={passwordForm}
                canSubmit={canSubmitPassword}
                isSubmitting={isSavingPassword}
                feedback={passwordFeedback}
                onSubmit={savePassword}
              />
            </div>

            <Separator />

            <SearchPreferencesSection
              value={settings.defaultSearchMode}
              onChange={(value) => {
                updateSettings({ defaultSearchMode: value });
              }}
            />
          </CardContent>
        </Card>

        {canManageApiKeys ? (
          <ApiKeysSection
            form={apiKeyForm}
            apiKeys={apiKeys.apiKeys}
            feedback={apiKeys.feedback}
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
      </div>
    </div>
  );
}
