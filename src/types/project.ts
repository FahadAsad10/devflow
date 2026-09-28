export type ProjectStatus = "Planning" | "Active" | "Completed";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  tasksTotal: number;
  tasksCompleted: number;
  members: number;
};
