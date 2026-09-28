const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

export type DashboardAnalytics = {
  projects: { total: number; planning: number; active: number; completed: number; overdue: number };
  tasks: { total: number; todo: number; inProgress: number; done: number; completionRate: number };
  teamMembers: number;
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
  assignee?: { id: string; name: string; email: string } | null;
  assigneeId?: string | null;
};

export type ApiAttachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  projectId: string;
  uploaderId: string;
  createdAt: string;
  uploader: { id: string; name: string };
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

export type ApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  project?: { id: string; name: string } | null;
};

export type TeamInvitation = {
  id: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: string;
  expiresAt: string;
  project: { id: string; name: string };
  sender: { name: string };
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
  analytics: () => request<DashboardAnalytics>("/api/analytics"),
  project: (id: string) => request<{ project: ApiProject }>(`/api/projects/${id}`),
  createProject: (input: { name: string; description: string; status: ApiProject["status"]; dueDate?: string }) =>
    request<{ project: ApiProject }>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
  updateProject: (id: string, input: Partial<{ name: string; description: string; status: ApiProject["status"]; dueDate: string | null }>) =>
    request<{ project: ApiProject }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteProject: (id: string) => request<void>(`/api/projects/${id}`, { method: "DELETE" }),
  tasks: () => request<{ tasks: ApiTask[] }>("/api/tasks"),
  projectTasks: (projectId: string) => request<{ tasks: ApiTask[] }>(`/api/tasks/project/${projectId}`),
  createTask: (projectId: string, input: { title: string; description?: string; status?: ApiTask["status"]; assigneeId?: string | null }) =>
    request<{ task: ApiTask }>(`/api/tasks/project/${projectId}`, { method: "POST", body: JSON.stringify(input) }),
  updateTask: (id: string, input: Partial<Pick<ApiTask, "title" | "description" | "status" | "assigneeId">>) =>
    request<{ task: ApiTask }>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteTask: (id: string) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
  attachments: (projectId: string) => request<{ attachments: ApiAttachment[] }>(`/api/attachments/project/${projectId}`),
  uploadAttachment: async (projectId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_URL}/api/attachments/project/${projectId}`, { method: "POST", credentials: "include", body: form });
    if (!response.ok) { const body = await response.json().catch(() => ({ message: "Upload failed." })); throw new Error(body.message ?? "Upload failed."); }
    return response.json() as Promise<{ attachment: ApiAttachment }>;
  },
  downloadAttachment: (id: string) => `${API_URL}/api/attachments/${id}/download`,
  deleteAttachment: (id: string) => request<void>(`/api/attachments/${id}`, { method: "DELETE" }),
  teams: () => request<{ members: TeamMember[] }>("/api/teams"),
  inviteMember: (projectId: string, input: { email: string; role: "ADMIN" | "MEMBER" }) =>
    request<{ invitation: { id: string; email: string; role: string; status: string; expiresAt: string } }>(`/api/teams/projects/${projectId}/invitations`, { method: "POST", body: JSON.stringify(input) }),
  invitations: () => request<{ invitations: TeamInvitation[] }>("/api/teams/invitations"),
  acceptInvitation: (id: string) => request<{ message: string }>(`/api/teams/invitations/${id}/accept`, { method: "POST" }),
  updateMemberRole: (projectId: string, userId: string, role: "ADMIN" | "MEMBER") =>
    request<{ message: string }>(`/api/teams/projects/${projectId}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMember: (projectId: string, userId: string) => request<void>(`/api/teams/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
  notifications: () => request<{ notifications: ApiNotification[] }>("/api/notifications"),
  markNotificationRead: (id: string) => request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request<void>("/api/notifications/read-all", { method: "POST" }),
  comments: (projectId: string) => request<{ comments: ApiComment[] }>(`/api/comments/project/${projectId}`),
  createComment: (projectId: string, body: string) =>
    request<{ comment: ApiComment }>(`/api/comments/project/${projectId}`, { method: "POST", body: JSON.stringify({ body }) }),
  deleteComment: (id: string) => request<void>(`/api/comments/${id}`, { method: "DELETE" }),
};
