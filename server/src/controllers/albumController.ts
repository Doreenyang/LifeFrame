import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAlbum(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const { title } = req.body;
  if (!title) return res.status(400).send({ error: 'title required' });
  const album = await prisma.album.create({ data: { userId, title } });
  res.status(201).send(album);
}

export async function listAlbums(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const albums = await prisma.album.findMany({ where: { userId }, include: { photos: true } });
  res.send(albums);
}
