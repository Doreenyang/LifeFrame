import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signJwt } from '../utils/jwt';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).send({ error: 'email and password required' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).send({ error: 'email already in use' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });
  const token = signJwt({ sub: user.id });
  res.status(201).send({ user: { id: user.id, email: user.email, name: user.name }, token });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send({ error: 'email and password required' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return res.status(401).send({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).send({ error: 'invalid credentials' });
  const token = signJwt({ sub: user.id });
  res.send({ user: { id: user.id, email: user.email, name: user.name }, token });
}
