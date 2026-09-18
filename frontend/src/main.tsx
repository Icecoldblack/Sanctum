import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Imported first: Chrome fires beforeinstallprompt early, before React mounts.
import '@/features/install/installPrompt'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
