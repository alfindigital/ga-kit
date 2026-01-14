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

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}
