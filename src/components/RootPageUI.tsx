import { ErrorScreen, LoadingScreen } from './Screen'

/**
 * What the app shows *instead of* a route, while the LIFF gate is deciding.
 *
 * The gate itself — `useLiff`, the login redirect — is routing and stays in
 * `src/routes/__root.tsx`. This is only the two things a person sees when no
 * route is allowed to render yet, so the wording of the failure can be edited
 * without opening the file that decides where a logged-out user goes.
 */
export function RootPageUI({ error }: { error?: string | null }) {
  if (error) return <ErrorScreen message={`เปิดผ่าน LINE ไม่สำเร็จ: ${error}`} />
  return <LoadingScreen />
}
