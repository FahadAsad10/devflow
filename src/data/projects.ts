import type { Project } from "../types/project";

export const initialProjects: Project[] = [
  {
    id: "devflow",
    name: "DevFlow",
    description: "Developer project management platform.",
    status: "Active",
    dueDate: "2026-12-15",
    tasksTotal: 24,
    tasksCompleted: 12,
    members: 4,
  },
  {
    id: "budget-tracker",
    name: "Smart Budget Tracker",
    description: "Personal finance tracking application.",
    status: "Active",
    dueDate: "2026-11-20",
    tasksTotal: 18,
    tasksCompleted: 10,
    members: 3,
  },
  {
    id: "pdf-clearer",
    name: "PDF Clearer",
    description: "PDF enhancement and OCR application.",
    status: "Completed",
    dueDate: "2026-08-30",
    tasksTotal: 15,
    tasksCompleted: 15,
    members: 2,
  },
];
