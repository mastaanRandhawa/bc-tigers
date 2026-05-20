/** Vite `base` without trailing slash; empty when serving from domain root. */
export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL;
  if (base === '/') return undefined;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

/** Absolute in-app path (respects GitHub Pages base, e.g. `/bc-tigers/login`). */
export function toAppPath(path: string): string {
  const segment = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${segment}`.replace(/\/{2,}/g, '/');
}

export const apiBaseUrl: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '/api' : 'https://bc-tigers.onrender.com/api');

/** Socket.IO server origin (not the `/api` path). */
export const socketBaseUrl: string | undefined =
  import.meta.env.VITE_SOCKET_URL ??
  (import.meta.env.DEV ? undefined : 'https://bc-tigers.onrender.com');
