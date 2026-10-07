import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loadPromise: Promise<void> | null = null;
const callbackName = '__gmaps_loader_cb__';

function loadScript(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    (window as Record<string, unknown>)[callbackName] = () => resolve();

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=geometry&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export type MapsStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [status, setStatus] = useState<MapsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setStatus('error');
      setError('Google Maps API key is not configured. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
      return;
    }

    let cancelled = false;
    setStatus('loading');
    loadScript(apiKey)
      .then(() => {
        if (!cancelled) setStatus('ready');
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setStatus('error');
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return { status, error };
}
