import { useCallback, useEffect, useState } from "react";
import { alumniList } from "@/data/mockAlumni";

const STORAGE_KEY = "utopia:favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (username: string) => favorites.includes(username),
    [favorites],
  );

  const addFavorite = useCallback((username: string) => {
    setFavorites((prev) => (prev.includes(username) ? prev : [...prev, username]));
  }, []);

  const removeFavorite = useCallback((username: string) => {
    setFavorites((prev) => prev.filter((u) => u !== username));
  }, []);

  const toggleFavorite = useCallback((username: string) => {
    setFavorites((prev) => (prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]));
  }, []);

  const favoriteAlumni = alumniList.filter((a: any) => favorites.includes(a.username));

  return { favorites, favoriteAlumni, isFavorite, addFavorite, removeFavorite, toggleFavorite };
}
