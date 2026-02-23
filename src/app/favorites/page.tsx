"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { JobTable } from "@/components/jobs/JobTable";
import { HeartCrack } from "lucide-react";

export default function FavoritesPage() {
    const { favorites, isLoaded } = useFavorites();

    if (!isLoaded) return null;

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">
                    Vos Favoris
                </h1>
                <p className="text-muted-foreground text-lg">
                    Retrouvez ici toutes les offres que vous avez sauvegardées.
                </p>
            </div>

            {favorites.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Liste des offres sauvegardées</h2>
                        <span className="text-sm text-muted-foreground">
                            {favorites.length} favori{favorites.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <JobTable data={favorites} />
                </div>
            ) : (
                <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-card rounded-xl border border-dashed border-border mt-8">
                    <HeartCrack className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium text-lg">Aucun favori pour le moment.</p>
                    <p className="text-sm text-muted-foreground/70">Cliquez sur le cœur d&apos;une offre pour l&apos;ajouter ici.</p>
                </div>
            )}
        </div>
    );
}
