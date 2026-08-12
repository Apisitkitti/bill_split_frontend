import liff from '@line/liff'

/**
 * The automatic LINE login redirect, and the one thing that keeps it from
 * becoming a loop.
 *
 * Every screen in this app needs an identity, so a logged-out visitor has
 * nothing useful to look at and sending them straight to LINE is the right
 * default. The reason this is not simply `liff.login()` at the call site is the
 * failure it caused before: the app redirected, LINE came back with `?code=`,
 * a session that did not stick left `isLoggedIn()` false, and the app
 * redirected again — forever, with the UI flashing and vanishing on the phone.
 *
 * So the redirect is rationed rather than trusted. It is spent:
 *
 *  - at most once per page load, by the module flag — two callers in the same
 *    frame (StrictMode, or an effect racing a 401) redirect once between them;
 *  - at most once per tab session across page loads, by the sessionStorage
 *    mark, which is written *before* leaving and survives the trip to LINE. If
 *    the app comes back still logged out, the mark is already there, no second
 *    redirect happens, and `LoginPageUI` shows its button instead.
 *
 * The mark is cleared only by `noteAuthedRequest`, on an API response that
 * actually came back — proof that the last redirect achieved something. That is
 * what makes the ration renewable without reopening the loop: a redirect can
 * only be spent again after a request has succeeded since the previous one.
 */
const ATTEMPT_KEY = 'billsplit.auto-login-attempted'

let redirecting = false

/**
 * sessionStorage throws rather than returning null in a few embedded browsers.
 * A tab with no storage cannot remember that it already redirected, so it must
 * not redirect at all — an unrememberable attempt is exactly the loop.
 */
function readAttempt(): boolean | null {
  try {
    return sessionStorage.getItem(ATTEMPT_KEY) !== null
  } catch {
    return null
  }
}

function markAttempt(): boolean {
  try {
    sessionStorage.setItem(ATTEMPT_KEY, '1')
    return true
  } catch {
    return false
  }
}

/**
 * Sends the browser to LINE if this tab still has its redirect to spend.
 *
 * Returns true when a redirect is under way, so the caller can keep showing a
 * loading state instead of flashing a screen the browser is about to leave.
 * False means the ration is spent and the caller owns the logged-out state —
 * which is the login button.
 */
export function redirectToLoginOnce(): boolean {
  if (redirecting) return true
  if (readAttempt() !== false) return false
  if (!markAttempt()) return false

  redirecting = true
  liff.login()
  return true
}

/** A request came back authorised, so the next failure may redirect again. */
export function noteAuthedRequest(): void {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY)
  } catch {
    // Nothing to clear in a tab that could not write the mark either.
  }
}
