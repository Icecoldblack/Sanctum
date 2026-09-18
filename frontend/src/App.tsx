import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from '@/context/SessionContext'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Sos } from '@/pages/Sos'
import { Decode } from '@/pages/Decode'
import { Therapy } from '@/pages/Therapy'
import { Legal } from '@/pages/Legal'
import { Privacy } from '@/pages/Privacy'
import { NotFound } from '@/pages/NotFound'

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/sos" element={<Sos />} />
              <Route path="/decode" element={<Decode />} />
              <Route path="/therapy" element={<Therapy />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
