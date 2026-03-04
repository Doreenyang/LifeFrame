import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).send({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = verifyJwt(token);
    // attach user id to request
    (req as any).userId = payload.sub || payload.id || payload.userId;
    next();
  } catch (err) {
    return res.status(401).send({ error: 'Invalid token' });
  }
}
