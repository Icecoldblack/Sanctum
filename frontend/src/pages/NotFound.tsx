import { Link } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Icon } from '@/components/shared/Icon'

export function NotFound() {
  return (
    <>
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-32 pb-20 text-center">
        <Icon name="explore" className="mb-6 text-primary text-4xl" />
        <h1 className="mb-3 text-3xl font-bold text-on-surface">Page not found</h1>
        <p className="mb-8 text-on-surface-variant">
          This page doesn't exist. You haven't left Sanctum.
        </p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
        >
          Back to Home
        </Link>
      </div>
    </>
  )
}
