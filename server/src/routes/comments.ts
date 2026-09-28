import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const commentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

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

router.get("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const comments = await prisma.comment.findMany({
      where: { projectId: project.id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
});

router.post("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });

    const input = commentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: { body: input.body, projectId: project.id, userId: req.userId! },
      include: { user: { select: { id: true, name: true } } },
    });
    const members = await prisma.membership.findMany({
      where: { projectId: project.id, userId: { not: req.userId! } },
      select: { userId: true },
    });
    if (members.length) {
      await prisma.notification.createMany({
        data: members.map((member) => ({
          userId: member.userId,
          projectId: project.id,
          type: "COMMENT",
          title: "New project comment",
          message: comment.user.name + " commented on " + project.id + ".",
        })),
      });
    }
    return res.status(201).json({ comment });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const commentId = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!commentId) return res.status(400).json({ message: "Comment id is required." });

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, userId: req.userId! },
      select: { id: true },
    });
    if (!comment) return res.status(404).json({ message: "Comment not found." });

    await prisma.comment.delete({ where: { id: comment.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
