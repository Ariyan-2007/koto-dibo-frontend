import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { queryClient } from '@/lib/queryClient'
import { bootstrapSession } from '@/lib/api/client'
import { initOfflineQueue } from '@/lib/offlineQueue'
import { bootstrapTheme } from '@/lib/theme/themeStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'

bootstrapTheme()
void bootstrapSession()
void initOfflineQueue()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)
