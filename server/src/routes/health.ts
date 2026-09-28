import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", service: "devflow-api" });
  } catch (error) {
    return next(error);
  }
});

export default router;
