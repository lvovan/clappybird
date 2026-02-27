import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initClarity } from './services/clarityService'

// Initialize Microsoft Clarity telemetry (no-op if project ID is missing)
initClarity(import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
