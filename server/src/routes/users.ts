import { Router } from 'express';
import { listUsers, getMe } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listUsers);
router.get('/me', requireAuth, getMe);

export default router;