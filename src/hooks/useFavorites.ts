import { useState, useEffect } from 'react';
import { Job } from '@/types/job';

const FAVORITES_KEY = 'forem_idable_favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState<Job[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load favorites', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    const addFavorite = (job: Job) => {
        setFavorites((prev) => {
            if (prev.some((f) => f.id === job.id)) return prev;
            return [...prev, job];
        });
    };

    const removeFavorite = (jobId: string) => {
        setFavorites((prev) => prev.filter((f) => f.id !== jobId));
    };

    const isFavorite = (jobId: string) => favorites.some((f) => f.id === jobId);

    return { favorites, addFavorite, removeFavorite, isFavorite, isLoaded };
}
