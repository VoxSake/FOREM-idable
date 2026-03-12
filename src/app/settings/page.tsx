"use client";

import { useState } from "react";
import Link from "next/link";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
    setAnalyticsConsentChoice,
    useAnalyticsConsentChoice,
} from "@/features/consent/analyticsConsent";
import { AuthSettingsPanel } from "@/components/auth/AuthSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";
import { ALL_STORAGE_KEYS } from "@/lib/storageKeys";
import { applySyncSnapshot, createSyncSnapshot, decodeSyncToken, encodeSyncToken } from "@/lib/syncToken";

export default function SettingsPage() {
    const { settings, updateSettings, isLoaded } = useSettings();
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const analyticsConsent = useAnalyticsConsentChoice();
    const [syncToken, setSyncToken] = useState("");
    const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
    const generatedToken = typeof window === "undefined"
        ? ""
        : encodeSyncToken(createSyncSnapshot(window.localStorage));

    if (!isLoaded) return null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                    Paramètres
                </h1>
                <p className="text-muted-foreground text-lg">
                    Personnalisez votre expérience sur FOREM-idable.
                </p>
            </div>

            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-8">
                {user ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold">Compte</h2>
                        <Separator />
                        <p className="text-sm text-muted-foreground">
                            Vous êtes connecté en tant que <span className="font-semibold text-foreground">{`${user.firstName} ${user.lastName}`.trim()}</span>{" "}
                            <span className="text-xs">({user.email})</span>. Les réglages de profil, mot de passe et clés API sont disponibles dans `Mon compte`.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild type="button">
                                <Link href="/account">Ouvrir Mon compte</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <AuthSettingsPanel />
                )}

                {/* Apparence */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Apparence</h2>
                    <Separator />

                    <div className="space-y-3">
                        <Label className="text-base">Thème de l&apos;application</Label>
                        <RadioGroup
                            defaultValue={theme}
                            onValueChange={(val) => {
                                setTheme(val);
                                window.dispatchEvent(new Event("forem-idable:local-state-changed"));
                            }}
                            className="flex flex-col space-y-2 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="theme-light" />
                                <Label htmlFor="theme-light" className="font-normal">Clair</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="theme-dark" />
                                <Label htmlFor="theme-dark" className="font-normal">Sombre</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="theme-system" />
                                <Label htmlFor="theme-system" className="font-normal">Système</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                {/* Préférences de recherche */}
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
                            onValueChange={(val: "AND" | "OR") => updateSettings({ defaultSearchMode: val })}
                            className="flex flex-col space-y-2 mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="OR" id="mode-or" />
                                <Label htmlFor="mode-or" className="font-normal">OU (Recherche inclusive, plus de résultats)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AND" id="mode-and" />
                                <Label htmlFor="mode-and" className="font-normal">ET (Recherche restrictive, plus précis)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                {/* Statistiques */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Statistiques</h2>
                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            G&eacute;rez votre choix pour les statistiques anonymes (Umami).
                            Vous pouvez l&apos;accepter ou le refuser &agrave; tout moment.
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

                {/* Données locales */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Synchronisation</h2>
                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Générez un jeton unique contenant vos favoris, candidatures, paramètres,
                            recherches, consentement et cache local, puis importez-le sur un autre appareil.
                        </p>
                        <Label htmlFor="sync-token-output" className="text-base">Jeton d&apos;export</Label>
                        <Input id="sync-token-output" readOnly value={generatedToken} />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(generatedToken);
                                        setSyncFeedback("Jeton copié dans le presse-papiers.");
                                    } catch {
                                        setSyncFeedback("Copie impossible. Le jeton reste affiché ci-dessus.");
                                    }
                                }}
                            >
                                Copier le jeton
                            </Button>
                        </div>

                        <Label htmlFor="sync-token-input" className="text-base">Importer un jeton</Label>
                        <Input
                            id="sync-token-input"
                            value={syncToken}
                            onChange={(event) => setSyncToken(event.target.value)}
                            placeholder="Collez ici un jeton de synchronisation"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    try {
                                        const snapshot = decodeSyncToken(syncToken);
                                        applySyncSnapshot(window.localStorage, snapshot);
                                        setSyncFeedback("Jeton importé. Rechargement en cours.");
                                        window.location.reload();
                                    } catch {
                                        setSyncFeedback("Jeton invalide ou corrompu.");
                                    }
                                }}
                                disabled={syncToken.trim().length === 0}
                            >
                                Importer le jeton
                            </Button>
                        </div>

                        {syncFeedback && (
                            <p className="text-sm text-muted-foreground">{syncFeedback}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-destructive">Zone de danger</h2>
                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Les données de l&apos;application (favoris, paramètres, historique et consentement)
                            sont stockées localement dans votre navigateur.
                            Vous pouvez les purger à tout moment.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer toutes les données locales de l'application ?")) {
                                    ALL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
                                    window.location.reload();
                                }
                            }}
                        >
                            Réinitialiser toutes les données
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
