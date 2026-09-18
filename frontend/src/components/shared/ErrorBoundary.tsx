import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/shared/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
          <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
          <p className="max-w-sm text-on-surface-variant">
            This page ran into a problem. Your data has not been affected. You can try reloading.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      )
    }

    return this.props.children
  }
}
