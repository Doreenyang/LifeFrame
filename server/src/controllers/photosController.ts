import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import supabase from '../services/supabaseClient';

const prisma = new PrismaClient();

export async function uploadPhoto(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const file = (req as any).file;
  if (!file) return res.status(400).send({ error: 'file missing' });

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'photos';
  const path = `${userId}/${Date.now()}_${file.originalname}`;

  // upload to supabase storage
  const { data, error } = await supabase.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });
  if (error) return res.status(500).send({ error: error.message });

  // create public URL (you can also create a signed URL)
  const { publicURL } = supabase.storage.from(bucket).getPublicUrl(path);

  const photo = await prisma.photo.create({ data: { userId, key: path, url: publicURL } });

  res.status(201).send(photo);
}

export async function listPhotos(req: Request, res: Response) {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).send({ error: 'Unauthorized' });
  const photos = await prisma.photo.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.send(photos);
}
