import { Link } from 'react-router-dom'
import { quickExit } from '@/features/quick-exit/quickExit'
import { useSession } from '@/hooks/useSession'

interface FooterProps {
  onIncognitoTips?: () => void
}

export function Footer({ onIncognitoTips }: FooterProps) {
  const { clearData } = useSession()

  async function handleErase() {
    await clearData()
  }

  return (
    <footer className="bg-surface-container text-on-surface-variant py-12 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-sm">
          <div className="text-2xl font-bold tracking-tighter text-[#4c6557] mb-4">Sanctum</div>
          <p className="text-sm leading-relaxed">
            Designed with care for women who feel unsafe and can't simply leave, by survivors and
            experts. We believe technology should protect, not track.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">
              Resources
            </h4>
            <button
              type="button"
              onClick={onIncognitoTips}
              className="text-sm text-left hover:text-primary transition-colors"
            >
              Safety Tips
            </button>
            <Link className="text-sm hover:text-primary transition-colors" to="/legal">
              Legal Basics
            </Link>
            <a
              className="text-sm hover:text-primary transition-colors"
              href="https://www.thehotline.org/resources/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Partners
            </a>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">Ethics</h4>
            <Link className="text-sm hover:text-primary transition-colors" to="/privacy">
              Data Zero Policy
            </Link>
            <Link className="text-sm hover:text-primary transition-colors" to="/privacy#how-we-work">
              How We Work
            </Link>
            <Link className="text-sm hover:text-primary transition-colors" to="/privacy#transparency">
              Transparency
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-on-surface text-sm uppercase tracking-widest">
              Emergency
            </h4>
            <button
              type="button"
              onClick={quickExit}
              className="text-sm text-left text-error font-bold hover:brightness-110 transition-colors"
            >
              Quick Exit
            </button>
            <button
              type="button"
              onClick={handleErase}
              className="text-sm text-left hover:text-primary transition-colors"
            >
              Erase Session
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 text-xs flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <span>© {new Date().getFullYear()} Sanctum Foundation. Private and secure.</span>
        <div className="flex gap-6">
          <Link className="hover:text-primary" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-primary" to="/terms">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
