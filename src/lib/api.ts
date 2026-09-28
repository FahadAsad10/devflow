const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

export type ApiProject = {
  id: string;
  name: string;
  description: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; memberships: number };
  tasks?: ApiTask[];
  memberships?: ProjectMember[];
};

export type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string };
};

export type ApiComment = {
  id: string;
  body: string;
  projectId: string;
  createdAt: string;
  user: { id: string; name: string };
};

export type ProjectMember = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: { id: string; name: string; email: string };
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  projects: string[];
};

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
    request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/api/auth/me"),
  projects: () => request<{ projects: ApiProject[] }>("/api/projects"),
  project: (id: string) => request<{ project: ApiProject }>(`/api/projects/${id}`),
  createProject: (input: { name: string; description: string; status: ApiProject["status"]; dueDate?: string }) =>
    request<{ project: ApiProject }>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
  updateProject: (id: string, input: Partial<{ name: string; description: string; status: ApiProject["status"]; dueDate: string | null }>) =>
    request<{ project: ApiProject }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  tasks: () => request<{ tasks: ApiTask[] }>("/api/tasks"),
  projectTasks: (projectId: string) => request<{ tasks: ApiTask[] }>(`/api/tasks/project/${projectId}`),
  createTask: (projectId: string, input: { title: string; description?: string; status?: ApiTask["status"] }) =>
    request<{ task: ApiTask }>(`/api/tasks/project/${projectId}`, { method: "POST", body: JSON.stringify(input) }),
  updateTask: (id: string, input: Partial<Pick<ApiTask, "title" | "description" | "status">>) =>
    request<{ task: ApiTask }>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  teams: () => request<{ members: TeamMember[] }>("/api/teams"),
  comments: (projectId: string) => request<{ comments: ApiComment[] }>(`/api/comments/project/${projectId}`),
  createComment: (projectId: string, body: string) =>
    request<{ comment: ApiComment }>(`/api/comments/project/${projectId}`, { method: "POST", body: JSON.stringify({ body }) }),
  deleteComment: (id: string) => request<void>(`/api/comments/${id}`, { method: "DELETE" }),
};
