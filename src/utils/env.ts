/** Trailing-slash を除いた base path。Astro の import.meta.env.BASE_URL を正規化。 */
export function getBaseUrl(): string {
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}
