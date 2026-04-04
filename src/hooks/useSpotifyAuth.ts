import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SpotifyConnection } from '@/types/wrapped';

export function useSpotifyAuth() {
  const [connection, setConnection] = useState<SpotifyConnection>({ connected: false, displayName: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'status' },
      });
      if (error) throw error;
      setConnection({
        connected: data?.connected ?? false,
        displayName: data?.displayName ?? null,
      });
    } catch {
      setConnection({ connected: false, displayName: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Handle OAuth callback from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const spotifyCallback = params.get('spotify_callback');

    if (code && spotifyCallback) {
      setIsConnecting(true);
      supabase.functions
        .invoke('spotify-auth', {
          body: { action: 'callback', code },
        })
        .then(({ data, error }) => {
          if (!error && data?.success) {
            setConnection({ connected: true, displayName: data.displayName });
          }
        })
        .finally(() => {
          // Clean URL params
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('spotify_callback');
          url.searchParams.delete('state');
          window.history.replaceState({}, '', url.pathname);
          setIsConnecting(false);
        });
    }
  }, []);

  const connectSpotify = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'getAuthUrl' },
      });
      if (error) throw error;
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setIsConnecting(false);
    }
  };

  const disconnectSpotify = async () => {
    try {
      await supabase.functions.invoke('spotify-auth', {
        body: { action: 'disconnect' },
      });
      setConnection({ connected: false, displayName: null });
    } catch {
      // silently ignore
    }
  };

  return {
    connection,
    isLoading,
    isConnecting,
    connectSpotify,
    disconnectSpotify,
    refreshConnection: checkConnection,
  };
}
