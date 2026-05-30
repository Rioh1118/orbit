const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "APIError";
  }
}

interface Envelope<T> {
  data: T;
  error: { code: string; message: string; details?: unknown } | null;
  meta: { total: number; limit: number; offset: number } | null;
}

async function call<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });

  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new APIError("PARSE_ERROR", `invalid json (status ${res.status})`);
  }

  if (!res.ok || body.error) {
    const err = body.error ?? { code: "HTTP_ERROR", message: res.statusText };
    throw new APIError(err.code, err.message, err.details);
  }

  return body;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const env = await call<T>(path, init);
  return env.data;
}

export async function requestList<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T[]; meta: Envelope<T[]>["meta"] }> {
  const env = await call<T[]>(path, init);
  return { data: env.data, meta: env.meta };
}

export async function requestNoBody(path: string, init?: RequestInit): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new APIError("HTTP_ERROR", `status ${res.status}`);
  }
}
