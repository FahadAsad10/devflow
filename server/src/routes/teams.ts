import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const roleSchema = z.object({ role: z.enum(["ADMIN", "MEMBER"]) });

async function canManageProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { memberships: { some: { userId, role: "ADMIN" } } },
      ],
    },
    select: { id: true, name: true, ownerId: true },
  });
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { OR: [{ ownerId: req.userId }, { memberships: { some: { userId: req.userId } } }] },
      select: {
        id: true,
        name: true,
        memberships: {
          select: { id: true, role: true, user: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const members = new Map<string, { id: string; name: string; email: string; role: string; projects: string[]; membershipIds: string[] }>();
    for (const project of projects) {
      for (const membership of project.memberships) {
        const current = members.get(membership.user.id);
        if (current) {
          current.projects.push(project.name);
          current.membershipIds.push(membership.id);
        } else {
          members.set(membership.user.id, {
            id: membership.user.id,
            name: membership.user.name,
            email: membership.user.email,
            role: membership.role,
            projects: [project.name],
            membershipIds: [membership.id],
          });
        }
      }
    }
    return res.json({ members: [...members.values()] });
  } catch (error) {
    return next(error);
  }
});

router.post("/projects/:projectId/invitations", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    if (!projectId) return res.status(400).json({ message: "Project id is required." });

    const project = await canManageProject(projectId, req.userId!);
    if (!project) return res.status(403).json({ message: "You cannot manage this project." });

    const input = inviteSchema.parse(req.body);
    if (input.email === (await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } }))?.email) {
      return res.status(400).json({ message: "You are already the project owner/member." });
    }

    const recipient = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, name: true } });
    if (recipient) {
      const existing = await prisma.membership.findUnique({ where: { userId_projectId: { userId: recipient.id, projectId } } });
      if (existing) return res.status(409).json({ message: "This user is already on the project." });
    }

    const invitation = await prisma.teamInvitation.create({
      data: {
        email: input.email,
        role: input.role,
        token: crypto.randomBytes(24).toString("hex"),
        projectId,
        senderId: req.userId!,
        recipientId: recipient?.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: { id: true, email: true, role: true, status: true, expiresAt: true },
    });

    if (recipient) {
      await prisma.notification.create({
        data: {
          userId: recipient.id,
          projectId,
          type: "TEAM_INVITATION",
          title: "Project invitation",
          message: `You were invited to join ${project.name}.`,
        },
      });
    }

    return res.status(201).json({ invitation });
  } catch (error) {
    return next(error);
  }
});

router.get("/invitations", async (req: AuthRequest, res, next) => {
  try {
    const email = await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } });
    if (!email) return res.status(401).json({ message: "User not found." });

    const invitations = await prisma.teamInvitation.findMany({
      where: {
        status: "PENDING",
        expiresAt: { gt: new Date() },
        OR: [{ recipientId: req.userId! }, { email: email.email }],
      },
      include: { project: { select: { id: true, name: true } }, sender: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ invitations });
  } catch (error) {
    return next(error);
  }
});

router.post("/invitations/:id/accept", async (req: AuthRequest, res, next) => {
  try {
    const invitationId = typeof req.params.id === "string" ? req.params.id : undefined;
    if (!invitationId) return res.status(400).json({ message: "Invitation id is required." });

    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { id: true, email: true } });
    if (!user) return res.status(401).json({ message: "User not found." });

    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
        OR: [{ recipientId: user.id }, { email: user.email }],
      },
    });
    if (!invitation) return res.status(404).json({ message: "Invitation not found or expired." });

    await prisma.$transaction([
      prisma.membership.upsert({
        where: { userId_projectId: { userId: user.id, projectId: invitation.projectId } },
        update: { role: invitation.role },
        create: { userId: user.id, projectId: invitation.projectId, role: invitation.role },
      }),
      prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED", recipientId: user.id } }),
      prisma.notification.create({
        data: {
          userId: invitation.senderId,
          projectId: invitation.projectId,
          type: "TEAM_JOINED",
          title: "Invitation accepted",
          message: `${user.email} joined your project.`,
        },
      }),
    ]);

    return res.json({ message: "Invitation accepted." });
  } catch (error) {
    return next(error);
  }
});

router.patch("/projects/:projectId/members/:userId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const memberUserId = typeof req.params.userId === "string" ? req.params.userId : undefined;
    if (!projectId || !memberUserId) return res.status(400).json({ message: "Project and user are required." });

    const project = await canManageProject(projectId, req.userId!);
    if (!project) return res.status(403).json({ message: "You cannot manage this project." });
    if (memberUserId === project.ownerId) return res.status(400).json({ message: "The owner role cannot be changed." });

    const input = roleSchema.parse(req.body);
    const membership = await prisma.membership.updateMany({
      where: { projectId, userId: memberUserId },
      data: { role: input.role },
    });
    if (!membership.count) return res.status(404).json({ message: "Member not found." });
    return res.json({ message: "Member role updated." });
  } catch (error) {
    return next(error);
  }
});

router.delete("/projects/:projectId/members/:userId", async (req: AuthRequest, res, next) => {
  try {
    const projectId = typeof req.params.projectId === "string" ? req.params.projectId : undefined;
    const memberUserId = typeof req.params.userId === "string" ? req.params.userId : undefined;
    if (!projectId || !memberUserId) return res.status(400).json({ message: "Project and user are required." });

    const project = await canManageProject(projectId, req.userId!);
    if (!project) return res.status(403).json({ message: "You cannot manage this project." });
    if (memberUserId === project.ownerId) return res.status(400).json({ message: "The owner cannot be removed." });

    await prisma.membership.deleteMany({ where: { projectId, userId: memberUserId } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
