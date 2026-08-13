import { Centered } from './Centered'

/** One way off this screen: what the button says, and what it does. */
export interface ErrorAction {
  label: string
  onClick: () => void
}

/**
 * The page-level failure treatment, for a failure with no screen to sit on.
 *
 * Three parts, and all three earn their place:
 *
 *  - a Thai headline, because the alert below is often the server's own English
 *    (`group not found`) and that is the only line on an otherwise Thai screen;
 *  - the server's message verbatim, because it is the only part that says what
 *    actually went wrong;
 *  - at least one action, because every one of these screens has a URL now. A
 *    group you are not in gets pasted into a chat and opened, and an alert with
 *    no button, no link and no tab bar leaves closing the LIFF window as the
 *    only exit.
 *
 * The actions arrive as data rather than as a fixed `onHome`/`onRetry` pair:
 * the four call sites want different exits (reload, the group picker, home) and
 * a primitive that names them would have to know which of them exist.
 */
export function ErrorScreen({
  message,
  title = 'เปิดหน้านี้ไม่ได้',
  actions = [],
  fullPage = true,
}: {
  message: string
  title?: string
  actions?: ErrorAction[]
  fullPage?: boolean
}) {
  return (
    <Centered fullPage={fullPage}>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-lg font-semibold">{title}</h1>

        <div role="alert" className="alert alert-error text-left text-sm">
          <span>{message}</span>
        </div>

        {/* The first action is the one to take, so it is the only filled
            button; the rest stay available without competing with it. */}
        {actions.map((action, i) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`btn btn-lg btn-block ${i === 0 ? 'btn-primary' : 'btn-outline'}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </Centered>
  )
}
