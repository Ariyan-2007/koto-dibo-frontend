import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { bootstrapSession } from '@/lib/api/client'
import { initOfflineQueue } from '@/lib/offlineQueue'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import App from './App'
import './index.css'

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
  </StrictMode>,
)
