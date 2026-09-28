import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const projectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  status: z.enum(["PLANNING", "ACTIVE", "COMPLETED"]).default("PLANNING"),
  dueDate: z.string().date().optional(),
});

const projectUpdateSchema = projectSchema.partial().extend({ dueDate: z.string().date().nullable().optional() }).refine((value) => Object.keys(value).length > 0, { message: "At least one field is required." });

const accessFilter = (userId: string) => ({
  OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: accessFilter(req.userId!),
      include: {
        _count: { select: { tasks: true, memberships: true } },
        tasks: { select: { status: true } },
        memberships: { select: { user: { select: { id: true } }, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ projects });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        ownerId: req.userId!,
        memberships: { create: { userId: req.userId!, role: "OWNER" } },
      },
      include: {
        _count: { select: { tasks: true, memberships: true } },
        tasks: { select: { status: true } },
      },
    });
    return res.status(201).json({ project });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!projectId) return res.status(400).json({ message: "Project id is required." });

    const project = await prisma.project.findFirst({
      where: { id: projectId, ...accessFilter(req.userId!) },
      include: {
        tasks: true,
        memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!project) return res.status(404).json({ message: "Project not found." });
    return res.json({ project });
  } catch (error) {
    return next(error);
  }
});

export default router;


router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!projectId) return res.status(400).json({ message: "Project id is required." });

    const input = projectUpdateSchema.parse(req.body);
    const existing = await prisma.project.findFirst({
      where: { id: projectId, ...accessFilter(req.userId!) },
      select: { id: true, ownerId: true },
    });
    if (!existing) return res.status(404).json({ message: "Project not found." });
    if (existing.ownerId !== req.userId) return res.status(403).json({ message: "Only the project owner can edit it." });

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      },
      include: {
        _count: { select: { tasks: true, memberships: true } },
        tasks: { select: { status: true } },
      },
    });
    return res.json({ project });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!projectId) return res.status(400).json({ message: "Project id is required." });

    const existing = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.userId! },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ message: "Project not found." });

    await prisma.project.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
