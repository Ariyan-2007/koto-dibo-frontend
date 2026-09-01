import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <p className="text-lg font-semibold text-ink">Something Went Wrong</p>
          <p className="max-w-sm text-sm text-muted">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <Button onClick={() => window.location.assign('/')}>Reload</Button>
        </div>
      )
    }
    return this.props.children
  }
}
