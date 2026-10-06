const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const apiBaseUrl = configuredBaseUrl ?? (process.env.NODE_ENV === "development" ? "http://localhost:5079" : "");

export function apiFetch(path: string, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-Requested-With", "XMLHttpRequest");
    if (init.body) headers.set("Content-Type", "application/json");
  }
  return fetch(`${apiBaseUrl}/api/v1${path}`, { ...init, method, headers, credentials: "include" });
}

export async function errorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json() as { message?: string; errors?: Record<string, string[]> };
    return body.message ?? Object.values(body.errors ?? {}).flat()[0] ?? fallback;
  } catch {
    return fallback;
  }
}
