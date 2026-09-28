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
});

const taskUpdateSchema = taskSchema.partial();

async function accessibleProject(projectId: string | undefined, userId: string) {
  if (!projectId) return null;
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
    select: { id: true },
  });
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }],
        },
      },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.get("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const project = await accessibleProject(req.params.projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const input = taskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...input, projectId: project.id },
    });
    return res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = taskUpdateSchema.parse(req.body);
    const existing = await prisma.task.findFirst({
      where: {
        id: typeof req.params.id === "string" ? req.params.id : undefined,
        project: {
          OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }],
        },
      },
    });
    if (!existing) return res.status(404).json({ message: "Task not found." });

    const task = await prisma.task.update({ where: { id: existing.id }, data: input });
    return res.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        project: {
          OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }],
        },
      },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Task not found." });

    await prisma.task.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
