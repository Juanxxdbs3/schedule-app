const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  errores?: string[];

  constructor(message: string, errores?: string[]) {
    super(message);
    this.name = "ApiError";
    this.errores = errores;
  }
}

function extraerMensaje(error: unknown): string {
  if (typeof error === "string") return error;
  if (Array.isArray(error)) {
    const mensajes = error
      .map((item) =>
        typeof item === "string" ? item : ((item as { message?: string })?.message ?? ""),
      )
      .filter(Boolean);
    return mensajes.length > 0 ? mensajes.join("\n") : "Request failed";
  }
  return "Request failed";
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: unknown;
      errores?: unknown;
    };
    const errores = Array.isArray(payload.errores)
      ? payload.errores.filter((e): e is string => typeof e === "string")
      : undefined;
    throw new ApiError(extraerMensaje(payload.error), errores);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
