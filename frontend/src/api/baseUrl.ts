/**
 * Cleans up VITE_API_BASE_URL so paths can always be joined as `${base}/api/...`.
 *
 * - A trailing slash is dropped.
 * - A host entered without a scheme (`api.example.com`) gets `https://`. Without one, the browser
 *   treats it as a path on the site itself, and every API call goes to the static host instead.
 * - Empty stays empty, which means the page's own origin.
 */
export function normalizeBaseUrl(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Where the backend lives, from VITE_API_BASE_URL at build time. */
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
