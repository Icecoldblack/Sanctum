import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Icon } from '@/components/shared/Icon'

interface Section {
  id: string
  heading: string
  body: string[]
}

const sections: Section[] = [
  {
    id: 'data-zero',
    heading: 'Data Zero Policy',
    body: [
      'Sanctum has no accounts, no sign-up, and no password. There is nothing to log into and nothing tied to your identity.',
      'A session is a random identifier held in your browser for the length of your visit. It expires after ten minutes of inactivity and is deleted on the server when it does.',
      'We set no advertising or analytics cookies. We do not embed third-party trackers. Nothing about your visit is sold or shared.',
    ],
  },
  {
    id: 'how-we-work',
    heading: 'How We Work',
    body: [
      'Chat messages are sent to an AI model to generate a reply, then stored against your session identifier so the conversation holds together while you use it. When the session expires, they go with it.',
      'Steganography runs on our server: the carrier image and your message are combined in memory, the finished image is returned to you directly, and neither the original text nor the result is written to disk.',
      'Decoding is entirely stateless. An uploaded image is read in memory and discarded when the response is sent. No session is required.',
      'Quick Exit clears this site’s local and session storage and redirects to a weather search. Three quick presses of Esc does the same thing from anywhere in the app.',
    ],
  },
  {
    id: 'transparency',
    heading: 'Transparency',
    body: [
      'Sanctum is a support tool, not an emergency service, and not a substitute for a lawyer, a doctor, or a trained advocate.',
      'AI replies can be wrong. Legal guidance in the Compass module is general information about rights and process, not legal advice, and no attorney-client relationship is created by using it.',
      'Steganography hides a message from a casual observer. It is not unbreakable, and it will not defeat forensic examination of your device. Treat it as one layer among several.',
      'Your browser history, your phone bill, and any monitoring software installed on your device are outside our reach. We cannot clear those for you.',
    ],
  },
  {
    id: 'terms',
    heading: 'Terms of Use',
    body: [
      'Sanctum is provided free and as-is, with no warranty. We make no guarantee of availability — if the service is down when you need it, call a hotline or emergency services instead.',
      'Do not rely on Sanctum as your only safety plan. Build one with a local advocate who knows your jurisdiction.',
      'If you are in immediate physical danger, stop reading and call your local emergency number.',
    ],
  },
]

export function Privacy() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pt-28 pb-20">
        <header className="mb-14">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-on-primary-container">
            <Icon name="shield" filled className="text-sm" />
            Privacy &amp; Terms
          </span>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tighter text-on-surface md:text-5xl">
            What we keep, and what we never see
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            Plain language, because a privacy policy you cannot read is not a promise. If anything
            here is unclear, assume the safest interpretation and act accordingly.
          </p>
        </header>

        <nav aria-label="On this page" className="mb-14 rounded-2xl bg-surface-container-low p-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            On this page
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {sections.map(({ id, heading }) => (
              <li key={id}>
                <a href={`#${id}`} className="text-sm font-medium text-primary hover:underline">
                  {heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          {sections.map(({ id, heading, body }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-primary">{heading}</h2>
              <div className="space-y-4">
                {body.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-16 flex gap-4 rounded-2xl border-l-4 border-error bg-error-container/10 p-6">
          <Icon name="info" className="shrink-0 text-error" />
          <p className="text-sm leading-relaxed text-on-surface-variant">
            <span className="block font-bold text-on-surface">If you are in danger right now</span>
            Call your local emergency number. Sanctum cannot dispatch help.
          </p>
        </aside>
      </main>
      <Footer />
    </>
  )
}
