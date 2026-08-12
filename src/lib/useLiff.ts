import { useEffect, useState } from 'react'
import liff from '@line/liff'

export interface LiffState {
  ready: boolean
  error: string | null
  /**
   * LIFF initialised but reports nobody signed in.
   *
   * The app used to call liff.login() here on its own. That is a redirect, so
   * when a session fails to stick the screen renders and vanishes in the same
   * frame — an invisible loop with nothing to read and nothing to press.
   * Surfacing the state and letting the user start the redirect turns that into
   * a screen, and gives them a way back after any failure.
   */
  needsLogin: boolean
  /** Starts the LINE login redirect. */
  login: () => void
  /**
   * The LINE chat this app was opened from, when it was opened from one.
   * Undefined in an external browser, where there is no chat to bind a group
   * to and no chat to post a summary into.
   */
  lineGroupId?: string
  /** True when liff.sendMessages is usable — only inside a chat. */
  canSendMessages: boolean
}

/**
 * One shared init across the whole page, kept outside React.
 *
 * StrictMode invokes an effect twice on mount, and the `cancelled` flag a
 * normal effect uses cannot help here: it can stop a setState, but it cannot
 * un-redirect a browser. Two concurrent `liff.init()` calls race for the
 * `?code=` that LINE puts in the URL after login — whichever loses sees a
 * logged-out session, calls `liff.login()`, and bounces back to the LINE login
 * page, forever. Sharing one promise makes init idempotent, so the second
 * caller awaits the first rather than starting its own.
 *
 * Two assumptions are baked in, and both hold only because `liffId` is one
 * build-time constant (`VITE_LIFF_ID`) for the life of the page:
 *
 *  - The promise is not keyed by `liffId`, so a second call with a different ID
 *    would silently reuse the first init rather than re-initialising.
 *  - It is not cleared when it rejects, so a transient `liff.init` failure is
 *    permanent until a full reload. That is deliberate: retrying init is what
 *    reopens the `?code=` race above, and the app already renders the failure as
 *    a screen the user can reload from.
 *
 * If this app ever initialises more than one LIFF ID, this must become a Map
 * keyed by `liffId`, and the retry question has to be answered properly.
 */
let initPromise: Promise<void> | null = null

function initOnce(liffId: string): Promise<void> {
  initPromise ??= liff.init({ liffId })
  return initPromise
}

/**
 * Initialises LIFF once and reports what the environment allows.
 *
 * Login is forced when the user is not signed in: every screen in this app
 * needs an identity, so there is no useful state to show a logged-out visitor.
 */
export function useLiff(liffId: string): LiffState {
  const [state, setState] = useState<LiffState>({
    ready: false,
    error: null,
    needsLogin: false,
    canSendMessages: false,
    login: () => liff.login(),
  })

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await initOnce(liffId)

        if (!liff.isLoggedIn()) {
          if (!cancelled) {
            setState({
              ready: false,
              error: null,
              needsLogin: true,
              canSendMessages: false,
              login: () => liff.login(),
            })
          }
          return
        }

        const context = liff.getContext()
        // getContext reports the chat type as well as its ID. A one-to-one
        // chat has no group ID, so a bill split there is an unbound group.
        const lineGroupId =
          context?.type === 'group'
            ? context.groupId
            : context?.type === 'room'
              ? context.roomId
              : undefined

        if (!cancelled) {
          setState({
            ready: true,
            error: null,
            needsLogin: false,
            lineGroupId,
            canSendMessages: context?.type === 'group' || context?.type === 'room',
            login: () => liff.login(),
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            ready: false,
            error: err instanceof Error ? err.message : 'LIFF init failed',
            needsLogin: false,
            canSendMessages: false,
            login: () => liff.login(),
          })
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [liffId])

  return state
}
