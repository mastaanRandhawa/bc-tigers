/**
 * Allowed browser origins for both REST (main.ts) and the WebSocket gateway.
 *
 * Driven by the `CORS_ORIGIN` env var (comma-separated). Falls back to the
 * local dev hosts plus the production GitHub Pages site when unset.
 */
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://mastaanrandhawa.github.io',
];

export function getCorsOrigins(): string[] {
  return process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : DEFAULT_ORIGINS;
}
