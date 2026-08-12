import { Component, type ErrorInfo, type ReactNode } from 'react'

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

    return (
      <div className="min-h-dvh bg-base-200 p-4">
        {/* The exception text is for whoever is debugging, not for the person
            holding the phone: they get a plain statement and one thing to do,
            and the raw message moves down into the details below. */}
        <div className="mb-4">
          <h1 className="text-lg font-semibold">เปิดหน้านี้ไม่สำเร็จ</h1>
          <p className="mt-1 text-sm">ลองโหลดใหม่อีกครั้ง</p>
        </div>

        <button
          onClick={() => {
            // A reload is the honest recovery: the tree that threw cannot be
            // trusted to re-render correctly from the state that produced it.
            window.location.href = window.location.pathname
          }}
          className="btn btn-primary btn-lg btn-block mb-4"
        >
          โหลดใหม่
        </button>

        {/* Kept visible rather than hidden behind a dev flag: this app is
            debugged on a phone, where the console is not reachable. */}
        <details className="collapse-arrow collapse bg-base-100">
          <summary className="collapse-title text-sm font-medium">
            รายละเอียดสำหรับ debug
          </summary>
          <div className="collapse-content">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">
              {error.message}
              {'\n'}
              {error.stack ?? String(error)}
              {stack}
            </pre>
          </div>
        </details>
      </div>
    )
  }
}
