import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const access = {
      OR: [{ ownerId: req.userId! }, { memberships: { some: { userId: req.userId! } } }],
    };

    const [projects, tasks, members] = await Promise.all([
      prisma.project.findMany({
        where: access,
        select: { id: true, status: true, dueDate: true },
      }),
      prisma.task.findMany({
        where: { project: access },
        select: { status: true },
      }),
      prisma.membership.findMany({
        where: { project: access },
        select: { userId: true },
      }),
    ]);

    const taskCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    for (const task of tasks) taskCounts[task.status] += 1;

    const projectCounts = { PLANNING: 0, ACTIVE: 0, COMPLETED: 0 };
    for (const project of projects) projectCounts[project.status] += 1;

    const now = new Date();
    const overdueProjects = projects.filter(
      (project) => project.dueDate && project.dueDate < now && project.status !== "COMPLETED",
    ).length;

    const completionRate = tasks.length === 0 ? 0 : Math.round((taskCounts.DONE / tasks.length) * 100);

    return res.json({
      projects: {
        total: projects.length,
        planning: projectCounts.PLANNING,
        active: projectCounts.ACTIVE,
        completed: projectCounts.COMPLETED,
        overdue: overdueProjects,
      },
      tasks: {
        total: tasks.length,
        todo: taskCounts.TODO,
        inProgress: taskCounts.IN_PROGRESS,
        done: taskCounts.DONE,
        completionRate,
      },
      teamMembers: new Set(members.map((member) => member.userId)).size,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
