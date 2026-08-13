import { ErrorScreen, LoadingScreen } from '../ui'

/**
 * What the app shows *instead of* a route, while the LIFF gate is deciding.
 *
 * The gate itself — `useLiff`, the login redirect — is routing and stays in
 * `src/routes/__root.tsx`. This is only the two things a person sees when no
 * route is allowed to render yet, so the wording of the failure can be edited
 * without opening the file that decides where a logged-out user goes.
 */
export function RootPageUI({ error }: { error?: string | null }) {
  if (error) {
    return (
      <ErrorScreen
        title="เปิดผ่าน LINE ไม่สำเร็จ"
        message={error}
        // A reload is the only exit that exists here: no route below has been
        // allowed to render, so there is nowhere in the app to go. `useLiff`
        // deliberately never retries init on its own — that is what reopens the
        // `?code=` race — so the retry has to be a fresh document. Dropping the
        // search with it: a spent `?code=` is one of the things init fails on,
        // and reloading it unchanged fails the same way.
        actions={[
          {
            label: 'ลองใหม่อีกครั้ง',
            onClick: () => {
              window.location.href = window.location.pathname
            },
          },
        ]}
      />
    )
  }
  return <LoadingScreen />
}
