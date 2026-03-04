import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, createdAt: true } });
  res.send(users);
}

export async function getMe(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
  if (!user) return res.status(404).send({ error: 'User not found' });
  res.send(user);
}
