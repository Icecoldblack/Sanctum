import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Imported first: Chrome fires beforeinstallprompt early, before React mounts.
import '@/features/install/installPrompt'
import { EXIT_PATH, leaveToExitSite, returnedAfterExit } from '@/features/quick-exit/quickExit'
import { App } from './App.tsx'

// The quick exit leaves decoy history entries at EXIT_PATH. Pressing Back onto one must never show
// the app, so it redirects to an exit site before anything renders. The same goes for any older
// Sanctum page reached with Back or Forward after a quick exit.
if (window.location.pathname === EXIT_PATH || returnedAfterExit()) {
  leaveToExitSite()
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
