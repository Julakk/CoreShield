/**
 * Locale-pinned number formatting. Using the default locale (toLocaleString()
 * with no args) can differ between server render (Node's environment locale)
 * and client render (the browser's locale), causing a React hydration
 * mismatch. Pinning to "en-US" everywhere keeps server and client output
 * identical.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
