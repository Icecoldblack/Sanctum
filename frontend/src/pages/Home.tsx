import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Icon } from '@/components/shared/Icon'

export function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="max-w-screen-xl mx-auto px-6 mb-24">
          <div className="relative rounded-3xl overflow-hidden min-h-[500px] flex items-center bg-surface-container-low">
            <div className="absolute inset-0 z-0 opacity-40">
              <img
                alt="Peaceful nature"
                className="w-full h-full object-cover"
                src="/images/hero-forest.png"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
            <div className="relative z-20 max-w-2xl px-12 py-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold tracking-widest uppercase mb-6">
                Private • Secure • Immediate
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-6 leading-tight">
                Your safety is <br />
                <span className="text-primary italic">your own.</span>
              </h1>
              <p className="text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
                Sanctum provides an ephemeral sanctuary. No accounts, no digital trails, just the
                support you need when you need it most.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/sos"
                  className="px-8 py-4 rounded-full bg-primary text-on-primary font-bold text-base hover:shadow-xl transition-all active:scale-95"
                >
                  Seek Support Now
                </Link>
                <a
                  href="#toolkit"
                  className="px-8 py-4 rounded-full bg-surface-container-highest text-on-surface-variant font-bold text-base hover:bg-surface-variant transition-all"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Promise Bento Grid */}
        <section className="max-w-screen-xl mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-surface-container rounded-3xl p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-primary mb-4">Total Privacy, Guaranteed</h2>
                <p className="text-on-surface-variant max-w-md text-lg leading-relaxed">
                  Every session is completely isolated. When you leave, we forget. No cookies, no
                  history, no tracking.
                </p>
              </div>
              <div className="mt-12 flex items-center gap-6 z-10">
                <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-xl">
                  <Icon name="lock_reset" className="text-primary" />
                  <span className="text-sm font-medium">Session-Only Storage</span>
                </div>
                <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-xl">
                  <Icon name="no_accounts" className="text-primary" />
                  <span className="text-sm font-medium">No Login Required</span>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-fixed-dim/20 blur-3xl" />
            </div>
            <div className="bg-tertiary-container rounded-3xl p-10 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-on-tertiary-container/10 flex items-center justify-center mb-6">
                <Icon name="vpn_key" className="text-on-tertiary-container text-4xl" />
              </div>
              <h3 className="text-xl font-bold text-on-tertiary-container mb-2">Encrypted Path</h3>
              <p className="text-on-tertiary-container/80 text-sm">
                Military-grade encryption ensures your conversations stay only with you.
              </p>
            </div>
          </div>
        </section>

        {/* The Three Tools Section */}
        <section id="toolkit" className="max-w-screen-xl mx-auto px-6 mb-32">
          <div className="mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface text-center">
              Your Supportive Toolkit
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto mt-4 rounded-full" />
          </div>
          <div className="space-y-12">
            {/* Tool 1: SOS Messenger */}
            <div className="flex flex-col md:flex-row items-center gap-12 group">
              <div className="w-full md:w-1/2 bg-surface-container-low rounded-[2rem] p-12 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Icon name="emergency_home" className="text-[120px]" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                  <Icon name="emergency_home" />
                  SOS Messenger
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                  Safety in plain sight. Our messenger uses steganography to hide your messages
                  inside ordinary photos, allowing you to reach for help without alerting anyone
                  nearby.
                </p>
                <Link
                  to="/sos"
                  className="text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform w-fit"
                >
                  Open Safety Messenger <Icon name="arrow_forward" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 rounded-[2rem] h-64 overflow-hidden shadow-sm">
                <img
                  alt="Subtle messaging"
                  className="w-full h-full object-cover"
                  src="/images/tool-sos.png"
                />
              </div>
            </div>

            {/* Tool 2: The Sanctuary */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 group">
              <div className="w-full md:w-1/2 bg-surface-container rounded-[2rem] p-12 relative overflow-hidden shadow-sm border border-primary-fixed/30">
                <div className="absolute top-0 left-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Icon name="psychology" className="text-[120px]" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                  <Icon name="psychology" />
                  The Sanctuary
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                  AI-driven crisis counseling available 24/7. A non-judgmental space to process
                  your feelings, build a safety plan, and find immediate emotional groundedness.
                </p>
                <Link
                  to="/therapy"
                  className="text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform w-fit"
                >
                  Enter the Sanctuary <Icon name="arrow_forward" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 rounded-[2rem] h-64 overflow-hidden shadow-sm">
                <img
                  alt="Calm yoga studio"
                  className="w-full h-full object-cover"
                  src="/images/tool-therapy.png"
                />
              </div>
            </div>

            {/* Tool 3: Compass */}
            <div className="flex flex-col md:flex-row items-center gap-12 group">
              <div className="w-full md:w-1/2 bg-surface-container-high rounded-[2rem] p-12 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Icon name="explore" className="text-[120px]" />
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                  <Icon name="explore" />
                  Compass
                </h3>
                <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                  Complex legal systems simplified. Find local resources, understand your rights,
                  and get step-by-step guidance for restraining orders and legal aid in your
                  jurisdiction.
                </p>
                <Link
                  to="/legal"
                  className="text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform w-fit"
                >
                  Navigate Rights <Icon name="arrow_forward" />
                </Link>
              </div>
              <div className="w-full md:w-1/2 rounded-[2rem] h-64 overflow-hidden shadow-sm">
                <img
                  alt="Legal guidance"
                  className="w-full h-full object-cover"
                  src="/images/tool-compass.png"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA / Safety Disclaimer */}
        <section className="max-w-screen-md mx-auto px-6 mb-20 text-center">
          <div className="bg-surface-container-lowest border border-outline-variant/10 p-12 rounded-[3rem] shadow-xl">
            <Icon name="info" className="text-error text-4xl mb-6" />
            <h2 className="text-3xl font-bold text-on-surface mb-6">Emergency Reminder</h2>
            <p className="text-on-surface-variant text-lg mb-10 leading-relaxed">
              If you are in immediate physical danger, please contact local emergency services.
              This platform is a support tool, not a replacement for emergency intervention.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <a
                href="tel:911"
                className="px-10 py-5 bg-secondary text-white rounded-full font-extrabold text-lg flex items-center justify-center gap-3 hover:shadow-2xl transition-all"
              >
                <Icon name="emergency" />
                Local Crisis Numbers
              </a>
              <button
                type="button"
                className="px-10 py-5 bg-surface-container-highest text-on-surface font-extrabold text-lg rounded-full flex items-center justify-center gap-3 hover:brightness-95 transition-all"
              >
                <Icon name="visibility_off" />
                Incognito Tips
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container text-on-surface-variant py-12 px-6">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="text-2xl font-bold tracking-tighter text-[#4c6557] mb-4">Sanctum</div>
            <p className="text-sm leading-relaxed">
              Designed with care for survivors, by survivors and experts. We believe technology
              should protect, not track.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">
                Resources
              </h4>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Safety Tips
              </a>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Legal Basics
              </a>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Partners
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">
                Ethics
              </h4>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Data Zero Policy
              </a>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                How We Work
              </a>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Transparency
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">
                Emergency
              </h4>
              <Link className="text-sm text-error font-bold hover:brightness-110 transition-colors" to="/sos">
                Quick Exit
              </Link>
              <a className="text-sm hover:text-primary transition-colors" href="#">
                Erase Session
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 text-xs flex justify-between items-center">
          <span>© 2024 Sanctum Foundation. Private and secure.</span>
          <div className="flex gap-6">
            <a className="hover:text-primary" href="#">
              Privacy
            </a>
            <a className="hover:text-primary" href="#">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
