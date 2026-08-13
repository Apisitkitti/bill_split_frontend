import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CrashScreen } from './CrashScreen'

interface Props {
  children: ReactNode
}

interface State {
  /**
   * Separate from `error` because the thrown value itself is not a reliable
   * signal: `throw null` gives a falsy `error`, and testing that alone would
   * make `render` hand back the children that just threw — React re-throws,
   * and the page goes blank in exactly the case the boundary exists for.
   *
   * The flag is what makes that safe here and not in the router's own
   * `CatchBoundary`, which does test the value alone. Route crashes reach that
   * one first, so surviving a falsy throw inside a screen is not this
   * boundary's job — `defaultOnCatch` in `main.tsx` re-throws it as an `Error`
   * so that whichever boundary catches it next, this one included, has
   * something truthy to render from. Measured: a falsy throw on a component's
   * first render escalates out of the router and arrives here raw, which is
   * why this stays a flag and not a truthiness test.
   */
  crashed: boolean
  error: unknown
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
 * Most of what it catches is outside the router — `RouterProvider` itself. A
 * crash inside a route component is caught first by the router's own
 * `CatchBoundary`, which is why the router is given the same screen through
 * `defaultErrorComponent` in `main.tsx`. Two kinds still land here: a crash in
 * the root route, whose only boundary above is this one, and a falsy throw that
 * React escalates past a `CatchBoundary` that could not render it. So this is
 * not only the boundary for the tree outside the router — it is also the last
 * one standing when the router's own gives up.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false, error: null, stack: null }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { crashed: true, error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // The component stack says which component threw, which the message alone
    // usually does not.
    this.setState({ stack: info.componentStack ?? null })
    console.error('render crashed', error, info.componentStack)
  }

  render() {
    const { crashed, error, stack } = this.state
    if (!crashed) return this.props.children

    return <CrashScreen error={error} componentStack={stack} />
  }
}
