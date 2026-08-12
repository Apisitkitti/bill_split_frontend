import { useEffect, useState } from 'react'
import liff from '@line/liff'
import { redirectToLoginOnce } from './autoLogin'

export interface LiffState {
  ready: boolean
  error: string | null
  /**
   * LIFF initialised, reports nobody signed in, and the automatic redirect has
   * already been spent — so this is the state that renders `LoginPageUI`.
   *
   * Arriving logged out sends the user to LINE on its own (see `autoLogin`);
   * this flag is what is left when that trip came back without a session. It
   * has to stay a screen with a button rather than another redirect: a second
   * automatic hop renders and vanishes in the same frame, which is an invisible
   * loop with nothing to read and nothing to press.
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
 * A visitor who is not signed in is sent to LINE automatically, because every
 * screen in this app needs an identity and there is nothing to show without
 * one. `redirectToLoginOnce` is what makes that safe rather than a loop.
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
          // The redirect happens here, in an effect, and never in a render
          // path. Returning without a setState leaves the loading screen up
          // while the browser leaves for LINE; showing the login button for the
          // one frame before that is a flash of a screen nobody can press.
          if (redirectToLoginOnce()) return

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
