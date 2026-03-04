import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createAlbum, listAlbums } from '../controllers/albumController';

const router = Router();

router.post('/', requireAuth, createAlbum);
router.get('/', requireAuth, listAlbums);

export default router;
