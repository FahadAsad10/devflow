import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
const allowedMimeTypes = new Set(["application/pdf","text/plain","text/csv","application/zip","application/json","image/jpeg","image/png","image/webp","image/gif"]);
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, allowedMimeTypes.has(file.mimetype)),
});

async function accessibleProject(projectId: string | undefined, userId: string) {
  if (!projectId) return null;
  return prisma.project.findFirst({
    where: { id: projectId, OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] },
    select: { id: true },
  });
}

router.get("/project/:projectId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) return res.status(404).json({ message: "Project not found." });
    const attachments = await prisma.attachment.findMany({ where: { projectId: project.id }, include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } });
    return res.json({ attachments });
  } catch (error) { return next(error); }
});

router.post("/project/:projectId", upload.single("file"), async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const project = await accessibleProject(projectId, req.userId!);
    if (!project) { if (req.file) await fs.rm(req.file.path, { force: true }); return res.status(404).json({ message: "Project not found." }); }
    if (!req.file) return res.status(400).json({ message: "Attach a supported file." });
    const attachment = await prisma.attachment.create({
      data: { filename: req.file.originalname.slice(0, 255), storedName: req.file.filename, mimeType: req.file.mimetype, size: req.file.size, projectId: project.id, uploaderId: req.userId! },
      include: { uploader: { select: { id: true, name: true } } },
    });
    const members = await prisma.membership.findMany({ where: { projectId: project.id, userId: { not: req.userId! } }, select: { userId: true } });
    if (members.length) await prisma.notification.createMany({ data: members.map((member) => ({ userId: member.userId, projectId: project.id, type: "FILE_UPLOADED", title: "New project file", message: attachment.filename + " was uploaded." })) });
    return res.status(201).json({ attachment });
  } catch (error) { if (req.file) await fs.rm(req.file.path, { force: true }).catch(() => undefined); return next(error); }
});

router.get("/:id/download", async (req: AuthRequest, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return res.status(404).json({ message: "Attachment not found." });
    const project = await accessibleProject(attachment.projectId, req.userId!);
    if (!project) return res.status(403).json({ message: "You do not have access to this file." });
    return res.download(path.join(uploadDir, attachment.storedName), attachment.filename);
  } catch (error) { return next(error); }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;
    const attachment = await prisma.attachment.findFirst({ where: { id, uploaderId: req.userId! } });
    if (!attachment) return res.status(404).json({ message: "Attachment not found." });
    await prisma.attachment.delete({ where: { id: attachment.id } });
    await fs.rm(path.join(uploadDir, attachment.storedName), { force: true });
    return res.status(204).send();
  } catch (error) { return next(error); }
});

export default router;