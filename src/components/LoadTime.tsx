import { useEffect, useState } from 'react';

export default function LoadTime() {
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();

    // Function to check if space data is loaded
    const checkLoaded = (interval: NodeJS.Timeout) => {
      const spaceData = document.querySelector('[data-space-loaded="true"]');
      if (spaceData) {
        const endTime = performance.now();
        setLoadTime(endTime - startTime);
        clearInterval(interval);
      }
    };

    // Check immediately and then every 100ms until loaded
    const interval = setInterval(() => checkLoaded(interval), 100);
    checkLoaded(interval);

    return () => clearInterval(interval);
  }, []);

  if (!loadTime) return null;

  return (
    <div className="text-gray-400 text-xs text-center pb-4">
      Space loaded in {(loadTime / 1000).toFixed(2)}s
    </div>
  );
} 