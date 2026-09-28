import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const taskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  assigneeId: z.string().cuid().nullable().optional(),
});
const taskUpdateSchema = taskSchema.partial().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required." });

async function accessibleProject(projectId: string | undefined, userId: string) {
  if (!projectId) return null;
  return prisma.project.findFirst({ where: { id: projectId, OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] }, select: { id: true, name: true, ownerId: true } });
}

async function validateAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (assigneeId === undefined || assigneeId === null) return true;
  const member = await prisma.membership.findUnique({ where: { userId_projectId: { userId: assigneeId, projectId } }, select: { id: true } });
  return Boolean(member);
}

async function notifyProjectMembers(projectId: string, actorId: string, title: string, message: string) {
  const members = await prisma.membership.findMany({ where: { projectId, userId: { not: actorId } }, select: { userId: true } });
  if (members.length) await prisma.notification.createMany({ data: members.map((member) => ({ userId: member.userId, projectId, type: "TASK_UPDATE", title, message })) });
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { project: { OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }] } },
      include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ tasks });
  } catch (error) { return next(error); }
});

router.get("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });
    const tasks = await prisma.task.findMany({ where: { projectId: project.id }, include: { assignee: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } });
    return res.json({ tasks });
  } catch (error) { return next(error); }
});

router.post("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });
    const input = taskSchema.parse(req.body);
    if (!(await validateAssignee(project.id, input.assigneeId))) return res.status(400).json({ message: "Assignee must be a project member." });
    const task = await prisma.task.create({ data: { title: input.title, description: input.description, status: input.status, projectId: project.id, assigneeId: input.assigneeId }, include: { assignee: { select: { id: true, name: true, email: true } } } });
    await notifyProjectMembers(project.id, req.userId!, "New task", task.title + " was added to " + project.name + ".");
    if (task.assigneeId && task.assigneeId !== req.userId) await prisma.notification.create({ data: { userId: task.assigneeId, projectId: project.id, type: "TASK_ASSIGNED", title: "Task assigned", message: "You were assigned \"" + task.title + "\"." } });
    return res.status(201).json({ task });
  } catch (error) { return next(error); }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = taskUpdateSchema.parse(req.body);
    const existing = await prisma.task.findFirst({ where: { id: typeof req.params.id === "string" ? req.params.id : undefined, project: { OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }] } }, include: { project: { select: { id: true, name: true } } } });
    if (!existing) return res.status(404).json({ message: "Task not found." });
    if (!(await validateAssignee(existing.project.id, input.assigneeId))) return res.status(400).json({ message: "Assignee must be a project member." });
    const task = await prisma.task.update({ where: { id: existing.id }, data: { ...(input.title !== undefined ? { title: input.title } : {}), ...(input.description !== undefined ? { description: input.description } : {}), ...(input.status !== undefined ? { status: input.status } : {}), ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}) }, include: { assignee: { select: { id: true, name: true, email: true } } } });
    if (input.assigneeId && input.assigneeId !== existing.assigneeId && input.assigneeId !== req.userId) await prisma.notification.create({ data: { userId: input.assigneeId, projectId: existing.project.id, type: "TASK_ASSIGNED", title: "Task assigned", message: "You were assigned \"" + task.title + "\"." } });
    if (input.status !== undefined && input.status !== existing.status) await notifyProjectMembers(existing.project.id, req.userId!, "Task status updated", task.title + " moved to " + input.status.replace("_", " ") + ".");
    return res.json({ task });
  } catch (error) { return next(error); }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({ where: { id: typeof req.params.id === "string" ? req.params.id : undefined, project: { OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }] } }, select: { id: true } });
    if (!existing) return res.status(404).json({ message: "Task not found." });
    await prisma.task.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;