import { useState, type ReactNode } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Icon } from '@/components/shared/Icon'
import { Switch } from '@/components/shared/Switch'
import { useSession } from '@/hooks/useSession'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { ShortcutRecorder } from '@/features/quick-exit/ShortcutRecorder'
import { ExitDestinationPicker } from '@/features/quick-exit/ExitDestinationPicker'
import { DisguisePicker } from '@/features/disguise/DisguisePicker'
import { CustomDisguiseEditor } from '@/features/disguise/CustomDisguiseEditor'
import { InstallPanel } from '@/features/install/InstallPanel'
import { openTour } from '@/features/onboarding/tourStore'

export function Settings() {
  const { prefs, update } = usePreferences()
  const { clearData } = useSession()
  const [editing, setEditing] = useState(false)
  const [erased, setErased] = useState(false)

  async function erase() {
    await clearData()
    setErased(true)
  }

  return (
    <>
      <Navbar />
      <Sidebar helpVariant="card" />
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-24 sm:px-6 lg:ml-64 lg:max-w-none lg:px-12">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">Safety settings</h1>
            <p className="mt-2 text-on-surface-variant">
              These stay on this device only. They aren't sent anywhere, and Quick Exit keeps them.
            </p>
          </header>

          <nav aria-label="Settings sections" className="mb-8 flex gap-2 overflow-x-auto pb-1">
            {[
              ['#quick-exit', 'Quick exit'],
              ['#disguise', 'Disguise'],
              ['#home-screen', 'Home screen'],
              ['#data', 'Your data'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="shrink-0 rounded-full bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="space-y-6">
            <Section id="quick-exit" icon="logout" title="Quick exit" description="Leave instantly if someone comes in.">
              <div>
                <p className="font-semibold text-on-surface">Keyboard shortcut</p>
                <p className="mb-3 mt-1 text-sm text-on-surface-variant">
                  Works on every page, even while you're typing. It's also shown next to the Quick Exit button.
                </p>
                <ShortcutRecorder />
              </div>
              <Divider />
              <ExitDestinationPicker />
              <Divider />
              <Switch
                checked={prefs.quickExit.eraseOnExit}
                onChange={(checked) => update((p) => ({ ...p, quickExit: { ...p.quickExit, eraseOnExit: checked } }))}
                label="Erase my chats when I exit"
                description="Deletes your conversations from our server as you leave. Recommended."
              />
            </Section>

            <Section
              id="disguise"
              icon="theater_comedy"
              title="Disguise"
              description="Change the name and icon in your browser tab, the header, and your home screen."
            >
              {editing ? <CustomDisguiseEditor onDone={() => setEditing(false)} /> : <DisguisePicker onCustomize={() => setEditing(true)} />}
            </Section>

            <Section id="home-screen" icon="add_to_home_screen" title="Home screen" description="Open it like an app, under your disguise.">
              <InstallPanel />
            </Section>

            <Section id="data" icon="shield" title="Your data" description="What's kept, and how to remove it.">
              <ul className="space-y-2 text-sm leading-relaxed text-on-surface-variant">
                <li>• Chats are stored encrypted on our server and erased after a day without use.</li>
                <li>• Hidden-message images are never stored. They are created and returned to you.</li>
                <li>• We never ask for your name, email, or phone number, and we don't log your IP address.</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={erase}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-error px-5 text-sm font-bold text-error hover:bg-error/5"
                >
                  <Icon name="delete_forever" className="text-lg" />
                  Erase my chats now
                </button>
                <button
                  type="button"
                  onClick={openTour}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant px-5 text-sm font-semibold text-primary hover:bg-primary-container/40"
                >
                  <Icon name="help" className="text-lg" />
                  Replay the guide
                </button>
              </div>
              {erased && (
                <p role="status" className="text-sm font-medium text-primary">
                  Your chats were erased. You're starting fresh.
                </p>
              )}
            </Section>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  )
}

function Section({ id, icon, title, description, children }: { id: string; icon: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-3xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/20 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary">
          <Icon name={icon} />
        </span>
        <div>
          <h2 id={`${id}-title`} className="text-xl font-bold text-on-surface">
            {title}
          </h2>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function Divider() {
  return <hr className="border-outline-variant/20" />
}
