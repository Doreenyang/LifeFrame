import { Router } from 'express';

const router = Router();

// simple in-memory store for demo
const users: Array<{ id: string; name: string }> = [];

router.post('/', (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
    return res.status(400).send({ error: 'id and name required' });
  }
  users.push({ id, name });
  res.status(201).send({ id, name });
});

router.get('/', (req, res) => {
  res.send(users);
});

export default router;