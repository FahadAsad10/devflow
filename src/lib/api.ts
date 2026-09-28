const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(body.message ?? "Request failed.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (input: { name: string; email: string; password: string }) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  projects: () => request("/api/projects"),
};
