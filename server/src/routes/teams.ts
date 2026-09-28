import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }],
      },
      select: {
        id: true,
        name: true,
        memberships: {
          select: {
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const members = new Map<string, { id: string; name: string; email: string; role: string; projects: string[] }>();

    for (const project of projects) {
      for (const membership of project.memberships) {
        const current = members.get(membership.user.id);
        if (current) {
          current.projects.push(project.name);
        } else {
          members.set(membership.user.id, {
            id: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
            role: membership.role,
            projects: [project.name],
          });
        }
      }
    }

    return res.json({ members: [...members.values()] });
  } catch (error) {
    return next(error);
  }
});

export default router;
