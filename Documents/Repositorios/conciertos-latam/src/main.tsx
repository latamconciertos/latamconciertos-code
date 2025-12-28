import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { handleError } from '@/lib/errors'

/**
 * React Query Client Configuration
 * 
 * Optimized defaults for production:
 * - staleTime: 5 minutes (reduces refetching)
 * - retry: 1 (single retry for failed requests)
 * - refetchOnWindowFocus: false (prevents aggressive refetching)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        handleError(error, { operation: 'Mutation' });
      },
    },
  },
})

// Register service worker for PWA
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);
