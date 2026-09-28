import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!id) return res.status(400).json({ message: "Notification id is required." });
    await prisma.notification.updateMany({ where: { id, userId: req.userId! }, data: { read: true } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.post("/read-all", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId!, read: false }, data: { read: true } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
