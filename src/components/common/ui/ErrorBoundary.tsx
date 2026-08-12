import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CrashScreen } from './CrashScreen'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  stack: string | null
}

/**
 * Catches render errors so a crash shows something instead of nothing.
 *
 * Without a boundary React 19 unmounts the whole tree when a render throws,
 * leaving a blank page and no message — the failure and the only clue about it
 * disappear together. That is expensive anywhere; inside LINE's in-app browser,
 * where opening devtools means plugging the phone into a computer, it is the
 * difference between a two-minute fix and an afternoon.
 *
 * This is a class because `componentDidCatch` has no hook equivalent.
 *
 * It only catches what is outside the router — `RouterProvider` itself. A crash
 * inside a route component is caught first by the router's own `CatchBoundary`,
 * which is why the router is given the same screen through
 * `defaultErrorComponent` in `main.tsx`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The component stack says which component threw, which the message alone
    // usually does not.
    this.setState({ stack: info.componentStack ?? null })
    console.error('render crashed', error, info.componentStack)
  }

  render() {
    const { error, stack } = this.state
    if (!error) return this.props.children

    return <CrashScreen error={error} componentStack={stack} />
  }
}
