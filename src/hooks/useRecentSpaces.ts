import { useState, useEffect } from 'react';

export function useRecentSpaces() {
  const [showRecentSpaces, setShowRecentSpaces] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('showRecentSpaces');
    setShowRecentSpaces(stored === null ? true : stored === 'true');
  }, []);

  return showRecentSpaces;
} 