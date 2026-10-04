// Same-origin "/api/v1" in production (nginx routes it to Django); a full URL in local dev.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

const ACCESS_KEY = "vp_access_token";
const REFRESH_KEY = "vp_refresh_token";

export function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: window.localStorage.getItem(ACCESS_KEY),
    refresh: window.localStorage.getItem(REFRESH_KEY),
  };
}

export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === "string" ? body : JSON.stringify(body));
    this.status = status;
    this.body = body;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  const res = await fetch(`${API_URL}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  window.localStorage.setItem(ACCESS_KEY, data.access);
  return data.access as string;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: HeadersInit = { ...(headers ?? {}) };
    const isFormData = rest.body instanceof FormData;
    if (!isFormData) {
      (finalHeaders as Record<string, string>)["Content-Type"] = "application/json";
    }
    if (auth) {
      const { access } = getTokens();
      if (access) {
        (finalHeaders as Record<string, string>)["Authorization"] = `Bearer ${access}`;
      }
    }
    return fetch(url, { ...rest, headers: finalHeaders });
  };

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** A short French message from any thrown error (DRF "detail" or first field error). */
export function errorMessage(e: unknown, fallback = "Une erreur est survenue, réessayez."): string {
  if (e instanceof ApiError && e.body && typeof e.body === "object") {
    const body = e.body as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    const first = Object.values(body)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  if (e instanceof TypeError) return "Pas de connexion internet.";
  return fallback;
}
