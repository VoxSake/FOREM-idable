"use client";

import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  setAnalyticsConsentChoice,
  useAnalyticsConsentChoice,
} from "@/features/consent/analyticsConsent";
import { AuthSettingsPanel } from "@/components/auth/AuthSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { ALL_STORAGE_KEYS, STORAGE_KEYS } from "@/lib/storageKeys";

export default function SettingsPage() {
  const { settings, updateSettings, isLoaded } = useSettings();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const analyticsConsent = useAnalyticsConsentChoice();

  if (!isLoaded) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Paramètres</h1>
        <p className="text-lg text-muted-foreground">
          Personnalisez votre expérience sur FOREM-idable.
        </p>
      </div>

      <div className="space-y-8 rounded-xl border bg-card p-6 shadow-sm">
        {user ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Compte</h2>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Vous êtes connecté en tant que{" "}
              <span className="font-semibold text-foreground">
                {`${user.firstName} ${user.lastName}`.trim()}
              </span>{" "}
              <span className="text-xs">({user.email})</span>. Le profil, le mot de passe et les clés API sont dans `Mon compte`.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button">
                <Link href="/account">Ouvrir Mon compte</Link>
              </Button>
              <Button asChild type="button" variant="outline">
                <Link href="/privacy">Confidentialité</Link>
              </Button>
            </div>
          </div>
        ) : (
          <AuthSettingsPanel />
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Apparence</h2>
          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Thème de l&apos;application</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value)}
              className="mt-2 flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light" className="font-normal">
                  Clair
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark" className="font-normal">
                  Sombre
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system" className="font-normal">
                  Système
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recherche</h2>
          <Separator />

          <div className="space-y-3">
            <Label className="text-base">Opérateur booléen par défaut</Label>
            <p className="text-sm text-muted-foreground">
              Définit le lien initial entre vos mots-clés lors d&apos;une nouvelle recherche.
            </p>
            <RadioGroup
              defaultValue={settings.defaultSearchMode}
              onValueChange={(value: "AND" | "OR") =>
                updateSettings({ defaultSearchMode: value })
              }
              className="mt-2 flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OR" id="mode-or" />
                <Label htmlFor="mode-or" className="font-normal">
                  OU (Recherche inclusive, plus de résultats)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AND" id="mode-and" />
                <Label htmlFor="mode-and" className="font-normal">
                  ET (Recherche restrictive, plus précis)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Statistiques</h2>
          <Separator />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              G&eacute;rez votre choix pour les statistiques anonymes (Umami). Vous pouvez l&apos;accepter ou le refuser &agrave; tout moment.
            </p>
            <p className="text-sm text-muted-foreground">
              Le détail du stockage local et des données liées au compte est disponible sur{" "}
              <Link className="text-primary hover:underline" href="/privacy">
                Confidentialité
              </Link>.
            </p>
            <p className="text-sm">
              Statut actuel:{" "}
              <span className="font-semibold">
                {analyticsConsent === "accepted"
                  ? "Accepté"
                  : analyticsConsent === "rejected"
                    ? "Refusé"
                    : "Non défini"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={analyticsConsent === "accepted" ? "default" : "outline"}
                aria-pressed={analyticsConsent === "accepted"}
                onClick={() => setAnalyticsConsentChoice("accepted")}
              >
                Accepter
              </Button>
              <Button
                type="button"
                variant={analyticsConsent === "rejected" ? "default" : "outline"}
                aria-pressed={analyticsConsent === "rejected"}
                onClick={() => setAnalyticsConsentChoice("rejected")}
              >
                Refuser
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-destructive">Zone de danger</h2>
          <Separator />

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Seules les préférences locales de base sont stockées dans votre navigateur: thème,
              opérateur booléen par défaut et choix statistiques. Les anciennes clés locales peuvent
              être supprimées à tout moment.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    "Êtes-vous sûr de vouloir supprimer toutes les données locales de l'application ?"
                  )
                ) {
                  ALL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
                  localStorage.removeItem(STORAGE_KEYS.settings);
                  window.location.reload();
                }
              }}
            >
              Réinitialiser les préférences locales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
