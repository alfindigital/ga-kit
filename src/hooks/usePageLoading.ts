import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [location.pathname, delay]);

  return isLoading;
}
