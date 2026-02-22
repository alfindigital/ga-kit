import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

export function useFavoriteTools() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('ga-toolkit-favorite-tools', []);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId) 
        : [...prev, toolId]
    );
  }, [setFavorites]);

  const isFavorite = useCallback((toolId: string) => {
    return favorites.includes(toolId);
  }, [favorites]);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [setFavorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    reorderFavorites,
  };
}
