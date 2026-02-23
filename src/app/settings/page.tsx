"use client";

import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const { settings, updateSettings, isLoaded } = useSettings();
    const { theme, setTheme } = useTheme();

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
                {/* Apparence */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Apparence</h2>
                    <Separator />

                    <div className="space-y-3">
                        <Label className="text-base">Thème de l&apos;application</Label>
                        <RadioGroup
                            defaultValue={theme}
                            onValueChange={(val) => setTheme(val)}
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

                {/* Données locales */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-destructive">Zone de danger</h2>
                    <Separator />

                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Les données (favoris, paramètres) sont stockées localement dans votre navigateur.
                            Vous pouvez les purger à tout moment.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer toutes vos données (favoris et paramètres) ?")) {
                                    localStorage.clear();
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
